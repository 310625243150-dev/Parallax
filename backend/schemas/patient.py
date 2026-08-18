from typing import Optional

from pydantic import BaseModel, ConfigDict


class PatientBase(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    medical_history: Optional[str] = None


class PatientCreate(PatientBase):
    id: str


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: str