from sqlalchemy.orm import Session

from services.patient_service import get_patient_or_404
from services.examination_service import (
    get_patient_history,
    get_patient_comparison,
)

from schemas.report import PatientReportResponse


def get_patient_report(db: Session, patient_id: str) -> PatientReportResponse:
    """
    Generate a complete patient report.

    Includes:
    - Patient information
    - Latest examination
    - Examination history
    - Comparison with previous examination
    """

    patient = get_patient_or_404(db, patient_id)

    history = get_patient_history(db, patient_id)

    comparison = get_patient_comparison(db, patient_id)

    latest = history[-1] if history else None

    return PatientReportResponse(
        patient=patient,
        latest_examination=latest,
        comparison=comparison,
        history=history,
    )
