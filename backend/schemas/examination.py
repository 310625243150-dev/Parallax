from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AnalyzeRequest(BaseModel):
    patient_id: str = Field(..., min_length=1, description="Target patient ID")
    audio_reference: str = Field(..., min_length=1, description="Path, URI, or identifier for the recorded audio signal")
    notes: Optional[str] = Field(default=None, description="Optional clinical notes for this examination session")


class ExaminationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: str
    timestamp: datetime
    audio_reference: str
    diagnosis: str
    confidence: float
    signal_quality: str
    model_version: str
    notes: Optional[str] = None
