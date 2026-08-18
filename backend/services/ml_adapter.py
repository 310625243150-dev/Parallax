"""
===============================================================================
REAL & MOCK ML ADAPTERS
===============================================================================
This module provides the interface for machine learning audio analysis.

- RealMLAdapter: Evaluates audio signal quality via Audio/src/quality.py
  and executes real ML model inference via ml/inference/predict.py
  using the trained model artifact (ml/models/heart_sound_model.pkl).
- MockMLAdapter: Deterministic fallback for contract testing.
===============================================================================
"""

import sys
from pathlib import Path
from typing import Dict, Any
from fastapi import HTTPException, status

# Add project root and module directories to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
AUDIO_SRC = PROJECT_ROOT / "Audio" / "src"
ML_DIR = PROJECT_ROOT / "ml"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(AUDIO_SRC) not in sys.path:
    sys.path.insert(0, str(AUDIO_SRC))
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

import librosa
from quality import assess_quality
from inference.predict import predict_for_api


class BaseMLAdapter:
    """Base interface for ML inference adapters."""
    def analyze(self, audio_reference: str) -> Dict[str, Any]:
        raise NotImplementedError


def resolve_audio_path(audio_reference: str) -> Path:
    """
    Safely resolve audio_reference string to an existing file on disk.
    Supports absolute paths and relative paths.
    """
    ref_path = Path(audio_reference)

    if ref_path.is_absolute() and ref_path.exists() and ref_path.is_file():
        return ref_path

    candidates = [
        Path.cwd() / ref_path,
        PROJECT_ROOT / ref_path,
        PROJECT_ROOT / "Audio" / ref_path,
        PROJECT_ROOT / "Audio" / "input" / ref_path,
        PROJECT_ROOT / "Audio" / "processed" / ref_path,
    ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate.resolve()

    raise FileNotFoundError(f"Audio file not found: '{audio_reference}'")


class RealMLAdapter(BaseMLAdapter):
    """
    Real ML Adapter executing:
    1. Safe audio file resolution.
    2. Signal quality assessment via Audio/src/quality.py.
    3. Trained model inference via ml/inference/predict.py (heart_sound_model.pkl).
    4. Label mapping ("normal" -> "Normal Heart Sound", "abnormal" -> "Abnormal Heart Sound").
    """

    def __init__(self, model_version: str = "v1.0.0-rf"):
        self.model_version = model_version

    def analyze(self, audio_reference: str) -> Dict[str, Any]:
        try:
            resolved_path = resolve_audio_path(audio_reference)
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

        try:
            # 1. Load audio for quality assessment
            audio, sample_rate = librosa.load(
                str(resolved_path),
                sr=None,
                mono=True
            )

            # 2. Run signal quality assessment (Audio/src/quality.py)
            quality_result = assess_quality(audio, sample_rate)
            raw_status = quality_result.get("overall_status", "UNKNOWN").upper()

            if raw_status in ("GOOD", "PASS"):
                signal_quality = "Good"
            elif raw_status == "FAIR":
                signal_quality = "Fair"
            elif raw_status in ("POOR", "FAIL"):
                signal_quality = "Poor"
            else:
                signal_quality = raw_status.title()

            # 3. Run real ML model inference (ml/inference/predict.py)
            ml_result = predict_for_api(str(resolved_path))

            raw_prediction = str(ml_result.get("prediction", "")).strip().lower()
            confidence = float(ml_result.get("confidence", 0.0))

            # 4. Map ML labels:
            # "normal" -> "Normal Heart Sound"
            # "abnormal" -> "Abnormal Heart Sound"
            if raw_prediction == "normal":
                diagnosis = "Normal Heart Sound"
            elif raw_prediction == "abnormal":
                diagnosis = "Abnormal Heart Sound"
            else:
                diagnosis = raw_prediction.title()

            return {
                "diagnosis": diagnosis,
                "confidence": round(confidence, 2),
                "signal_quality": signal_quality,
                "model_version": self.model_version
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to analyze audio file: {str(e)}"
            )


class MockMLAdapter(BaseMLAdapter):
    """
    Mock ML Adapter for backend API contract testing.
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


# Default singleton instance for production: RealMLAdapter
_ml_adapter_instance: BaseMLAdapter = RealMLAdapter()


def get_ml_adapter() -> BaseMLAdapter:
    """Return the active ML adapter instance."""
    return _ml_adapter_instance


def set_ml_adapter(adapter: BaseMLAdapter):
    """Set the active ML adapter instance (e.g. for testing)."""
    global _ml_adapter_instance
    _ml_adapter_instance = adapter

