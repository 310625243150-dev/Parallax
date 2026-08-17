from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.examination import AnalyzeRequest
from schemas.comparison import AnalysisResultResponse
from services.examination_service import analyze_examination

router = APIRouter(prefix="/api/examinations", tags=["Examinations"])


@router.post("/analyze", response_model=AnalysisResultResponse, status_code=status.HTTP_201_CREATED)
def analyze_examination_endpoint(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyze audio examination for a patient using ML model inference,
    persist examination results, and compute diagnostic comparison against history.
    """
    return analyze_examination(db, request)
