from typing import Optional
from pydantic import BaseModel, ConfigDict
from .examination import ExaminationResponse


class ComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_id: str
    has_previous: bool
    previous_diagnosis: Optional[str] = None
    previous_confidence: Optional[float] = None
    current_diagnosis: Optional[str] = None
    current_confidence: Optional[float] = None
    change_detected: bool = False
    details: str


class AnalysisResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    examination: ExaminationResponse
    comparison: ComparisonResponse
