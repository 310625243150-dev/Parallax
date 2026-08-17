from fastapi import FastAPI, UploadFile, File
import os
import shutil
import tempfile

from inference.predict import predict_for_api


app = FastAPI(
    title="EchoAssist ML API",
    version="1.0"
)


@app.get("/")
def root():
    return {
        "status": "running",
        "service": "EchoAssist ML",
        "model": "EchoAssist v1"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "EchoAssist v1"
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".wav"):
        return {
            "error": "Only WAV files are supported"
        }

    temp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".wav"
        ) as temp_file:

            temp_path = temp_file.name

            shutil.copyfileobj(
                file.file,
                temp_file
            )

        result = predict_for_api(
            temp_path
        )

        return {
            "filename": file.filename,
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "model": "EchoAssist v1"
        }

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
            