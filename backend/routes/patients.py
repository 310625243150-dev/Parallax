from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.database import get_db

from schemas.patient import PatientCreate, PatientResponse
from schemas.examination import ExaminationResponse
from schemas.comparison import ComparisonResponse
from schemas.report import PatientReportResponse

from services.patient_service import (
    create_patient,
    get_all_patients,
    get_patient_or_404,
)

from services.examination_service import (
    get_patient_history,
    get_patient_comparison,
)

from services.report_service import get_patient_report

router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"],
)


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_endpoint(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
):
    """Create a new patient."""
    return create_patient(db, patient_in)


@router.get(
    "",
    response_model=List[PatientResponse],
)
def get_patients_endpoint(
    db: Session = Depends(get_db),
):
    """Retrieve all patients."""
    return get_all_patients(db)


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
)
def get_patient_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve a patient by ID."""
    return get_patient_or_404(db, patient_id)


@router.get(
    "/{patient_id}/history",
    response_model=List[ExaminationResponse],
)
def get_patient_history_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve patient's examination history."""
    return get_patient_history(db, patient_id)


@router.get(
    "/{patient_id}/comparison",
    response_model=ComparisonResponse,
)
def get_patient_comparison_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Compare latest examination with previous examination."""
    return get_patient_comparison(db, patient_id)


@router.get(
    "/{patient_id}/report",
    response_model=PatientReportResponse,
)
def get_patient_report_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns:
    - Patient details
    - Latest examination
    - Complete examination history
    - Previous vs current comparison
    """
    return get_patient_report(db, patient_id)