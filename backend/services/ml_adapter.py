"""
===============================================================================
DEVELOPMENT MOCK ML ADAPTER
===============================================================================
This module serves as the isolated interface for machine learning audio analysis.

DEVELOPMENT-ONLY:
- This is a mock adapter used during backend development & automated testing.
- It simulates ML model inference based on input audio references.
- DO NOT use mock results in production.

FOR THE ML TEAMMATE:
- Replace or extend `MockMLAdapter` / `get_ml_adapter()` with the actual ML model wrapper.
- Ensure the return dict or object contains:
  `diagnosis` (str), `confidence` (float), `signal_quality` (str), `model_version` (str).
===============================================================================
"""

from typing import Dict, Any


class BaseMLAdapter:
    """Base interface for ML inference adapters."""
    def analyze(self, audio_reference: str) -> Dict[str, Any]:
        raise NotImplementedError


class MockMLAdapter(BaseMLAdapter):
    """
    Mock ML Adapter for backend testing and prototyping.
    Evaluates basic keywords in `audio_reference` to produce deterministic results.
    """
    def __init__(self, model_version: str = "v1.0.0-mock"):
        self.model_version = model_version

    def analyze(self, audio_reference: str) -> Dict[str, Any]:
        ref_lower = audio_reference.lower()

        if "murmur" in ref_lower or "regurgitation" in ref_lower:
            diagnosis = "Mitral Regurgitation"
            confidence = 0.89
            signal_quality = "Good"
        elif "stenosis" in ref_lower or "aortic" in ref_lower:
            diagnosis = "Aortic Stenosis"
            confidence = 0.92
            signal_quality = "High"
        elif "abnormal" in ref_lower or "arrhythmia" in ref_lower:
            diagnosis = "Arrhythmia Detected"
            confidence = 0.81
            signal_quality = "Medium"
        elif "noisy" in ref_lower or "poor" in ref_lower:
            diagnosis = "Inconclusive - Signal Noise"
            confidence = 0.52
            signal_quality = "Low"
        else:
            diagnosis = "Normal Heart Sound"
            confidence = 0.95
            signal_quality = "High"

        return {
            "diagnosis": diagnosis,
            "confidence": round(confidence, 2),
            "signal_quality": signal_quality,
            "model_version": self.model_version
        }


# Singleton factory for dependency injection / swapping real ML model later
_ml_adapter_instance = MockMLAdapter()


def get_ml_adapter() -> BaseMLAdapter:
    """Return the active ML adapter instance."""
    return _ml_adapter_instance
