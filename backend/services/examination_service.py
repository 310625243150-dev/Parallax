from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.patient import Patient
from models.examination import Examination
from schemas.examination import AnalyzeRequest
from schemas.comparison import ComparisonResponse, AnalysisResultResponse
from services.patient_service import get_patient_or_404
from services.ml_adapter import get_ml_adapter


def analyze_examination(db: Session, request: AnalyzeRequest) -> AnalysisResultResponse:
    """
    Process audio examination request:
    1. Check patient existence.
    2. Pass audio to ML service adapter.
    3. Save examination record.
    4. Retrieve previous examinations for comparison.
    5. Return analysis result with comparison details.
    """
    patient = get_patient_or_404(db, request.patient_id)

    # ML Adapter inference
    ml_adapter = get_ml_adapter()
    ml_result = ml_adapter.analyze(request.audio_reference)

    # Create new examination record
    db_examination = Examination(
        patient_id=patient.id,
        audio_reference=request.audio_reference,
        diagnosis=ml_result["diagnosis"],
        confidence=ml_result["confidence"],
        signal_quality=ml_result["signal_quality"],
        model_version=ml_result["model_version"],
        notes=request.notes
    )
    db.add(db_examination)
    db.commit()
    db.refresh(db_examination)

    # Compute comparison against previous history
    comparison = get_patient_comparison(db, patient.id)

    return AnalysisResultResponse(
        examination=db_examination,
        comparison=comparison
    )


def get_patient_history(db: Session, patient_id: str) -> List[Examination]:
    """Retrieve patient's examination history in chronological order."""
    get_patient_or_404(db, patient_id)
    return (
        db.query(Examination)
        .filter(Examination.patient_id == patient_id)
        .order_by(Examination.timestamp.asc())
        .all()
    )


def get_patient_comparison(db: Session, patient_id: str) -> ComparisonResponse:
    """
    Compare the latest examination with the previous relevant examination.
    Handles patients with 0, 1, or 2+ examinations cleanly.
    """
    get_patient_or_404(db, patient_id)

    examinations = (
        db.query(Examination)
        .filter(Examination.patient_id == patient_id)
        .order_by(Examination.timestamp.desc())
        .all()
    )

    if not examinations:
        return ComparisonResponse(
            patient_id=patient_id,
            has_previous=False,
            details="No examinations found for this patient."
        )

    current_ex = examinations[0]

    if len(examinations) == 1:
        return ComparisonResponse(
            patient_id=patient_id,
            has_previous=False,
            current_diagnosis=current_ex.diagnosis,
            current_confidence=current_ex.confidence,
            change_detected=False,
            details="First recorded examination. No prior examination exists for comparison."
        )

    previous_ex = examinations[1]

    diagnosis_changed = (current_ex.diagnosis != previous_ex.diagnosis)
    confidence_delta = abs(current_ex.confidence - previous_ex.confidence)
    confidence_changed = confidence_delta >= 0.05
    change_detected = diagnosis_changed or confidence_changed

    if diagnosis_changed:
        details = (
            f"Diagnosis changed from '{previous_ex.diagnosis}' (confidence: {previous_ex.confidence:.2f}) "
            f"to '{current_ex.diagnosis}' (confidence: {current_ex.confidence:.2f})."
        )
    elif confidence_changed:
        details = (
            f"Diagnosis unchanged ('{current_ex.diagnosis}'), but confidence shifted by {confidence_delta:.2f} "
            f"(from {previous_ex.confidence:.2f} to {current_ex.confidence:.2f})."
        )
    else:
        details = f"Stable condition. Diagnosis remains '{current_ex.diagnosis}' with consistent confidence."

    return ComparisonResponse(
        patient_id=patient_id,
        has_previous=True,
        previous_diagnosis=previous_ex.diagnosis,
        previous_confidence=previous_ex.confidence,
        current_diagnosis=current_ex.diagnosis,
        current_confidence=current_ex.confidence,
        change_detected=change_detected,
        details=details
    )
