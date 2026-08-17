from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class Examination(Base):
    __tablename__ = "examinations"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    audio_reference = Column(String(255), nullable=False)
    diagnosis = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    signal_quality = Column(String(50), nullable=False)
    model_version = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="examinations")
