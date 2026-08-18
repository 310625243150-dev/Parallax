from .patients import router as patients_router
from .examinations import router as examinations_router
from .audio import router as audio_router

__all__ = ["patients_router", "examinations_router", "audio_router"]
