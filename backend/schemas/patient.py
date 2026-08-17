from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PatientCreate(BaseModel):
    id: Optional[str] = Field(
        default=None,
        description="Optional custom patient ID. If omitted, an ID will be generated automatically."
    )
    name: str = Field(..., min_length=1, max_length=100, description="Patient's full name")
    age: int = Field(..., ge=0, le=150, description="Patient's age in years")
    gender: Optional[str] = Field(default=None, max_length=20, description="Patient's gender")
    medical_history: Optional[str] = Field(default=None, description="Relevant medical background or clinical notes")


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    age: int
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    created_at: datetime
