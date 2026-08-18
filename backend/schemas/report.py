from typing import List
from pydantic import BaseModel, ConfigDict

from .patient import PatientResponse
from .comparison import ComparisonResponse
from .examination import ExaminationResponse


class PatientReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient: PatientResponse
    latest_examination: ExaminationResponse | None
    comparison: ComparisonResponse
    history: List[ExaminationResponse]