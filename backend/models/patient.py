from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.orm import relationship

from database.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    examinations = relationship(
        "Examination",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="Examination.timestamp.asc()"
    )
