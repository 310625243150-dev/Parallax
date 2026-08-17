import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.patient import Patient
from schemas.patient import PatientCreate


def create_patient(db: Session, patient_in: PatientCreate) -> Patient:
    """Create a new patient record in the database."""
    patient_id = patient_in.id
    if not patient_id or not patient_id.strip():
        patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    else:
        patient_id = patient_id.strip()

    # Check for existing patient with same ID
    existing = db.query(Patient).filter(Patient.id == patient_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient with ID '{patient_id}' already exists."
        )

    db_patient = Patient(
        id=patient_id,
        name=patient_in.name.strip(),
        age=patient_in.age,
        gender=patient_in.gender.strip() if patient_in.gender else None,
        medical_history=patient_in.medical_history.strip() if patient_in.medical_history else None,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_patient(db: Session, patient_id: str) -> Optional[Patient]:
    """Retrieve a single patient by ID."""
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_patient_or_404(db: Session, patient_id: str) -> Patient:
    """Retrieve a patient by ID or raise HTTP 404."""
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return patient


def get_all_patients(db: Session) -> List[Patient]:
    """Retrieve all patient records."""
    return db.query(Patient).order_by(Patient.created_at.desc()).all()
