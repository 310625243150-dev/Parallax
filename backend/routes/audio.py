import re
import time
import uuid
from pathlib import Path
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/audio", tags=["Audio"])

# Maximum allowed audio upload size (25 MB)
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

# Audio input directory for saving uploaded files (accessible to ML pipeline via resolve_audio_path)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
AUDIO_INPUT_DIR = PROJECT_ROOT / "Audio" / "input"


class AudioUploadResponse(BaseModel):
    audio_reference: str
    filename: str
    size_bytes: int


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and invalid characters."""
    base_name = Path(filename).name
    sanitized = re.sub(r"[^a-zA-Z0-9_.-]", "_", base_name)
    if not sanitized.lower().endswith(".wav"):
        sanitized += ".wav"
    return sanitized


@router.post(
    "/upload",
    response_model=AudioUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload original WAV audio file",
    description="Upload an unprocessed WAV file to backend audio storage and receive an audio_reference for examination analysis."
)
async def upload_audio_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    # 1. Validate file extension
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only WAV (.wav) files are supported."
        )

    # 2. Read content and check size limit
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty."
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # 3. Validate RIFF / WAVE header format
    if len(content) < 12 or content[:4] != b"RIFF" or content[8:12] != b"WAVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid WAV file header. The uploaded file is not a valid RIFF/WAVE audio file."
        )

    # 4. Ensure storage directory exists
    AUDIO_INPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 5. Generate unique filename preserving original name
    safe_name = sanitize_filename(file.filename)
    unique_filename = f"upload_{int(time.time())}_{uuid.uuid4().hex[:8]}_{safe_name}"
    target_path = AUDIO_INPUT_DIR / unique_filename

    # 6. Save original unmodified WAV content
    try:
        with open(target_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save audio file to storage: {str(e)}"
        )

    return AudioUploadResponse(
        audio_reference=unique_filename,
        filename=file.filename,
        size_bytes=file_size
    )
