import sys
import os
from pathlib import Path

import numpy as np
import librosa
import joblib

from scipy.signal import butter, sosfiltfilt


# ============================================================
# PATHS
# ============================================================

# predict.py is inside:
# EchoAssist/ml/inference/
#
# parent.parent = EchoAssist/ml/

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_FILE = BASE_DIR / "models" / "heart_sound_model.pkl"


# ============================================================
# AUDIO SETTINGS
# ============================================================

LOWCUT = 20
HIGHCUT = 400


# ============================================================
# AUDIO PREPROCESSING
# ============================================================

def preprocess_audio(audio, sr):

    nyquist = sr / 2

    highcut = min(
        HIGHCUT,
        nyquist * 0.9
    )

    if LOWCUT >= highcut:
        return audio

    sos = butter(
        4,
        [LOWCUT, highcut],
        btype="bandpass",
        fs=sr,
        output="sos"
    )

    filtered = sosfiltfilt(
        sos,
        audio
    )

    max_value = np.max(
        np.abs(filtered)
    )

    if max_value > 0:
        filtered = filtered / max_value

    return filtered


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def extract_features(audio, sr):

    # 13 MFCC features
    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sr,
        n_mfcc=13
    )

    # MFCC mean
    mfcc_mean = np.mean(
        mfcc,
        axis=1
    )

    # MFCC standard deviation
    mfcc_std = np.std(
        mfcc,
        axis=1
    )

    # Spectral centroid
    spectral_centroid = np.mean(
        librosa.feature.spectral_centroid(
            y=audio,
            sr=sr
        )
    )

    # Spectral bandwidth
    spectral_bandwidth = np.mean(
        librosa.feature.spectral_bandwidth(
            y=audio,
            sr=sr
        )
    )

    # Zero crossing rate
    zero_crossing_rate = np.mean(
        librosa.feature.zero_crossing_rate(
            audio
        )
    )

    # Total = 13 + 13 + 3 = 29 features
    features = np.concatenate([
        mfcc_mean,
        mfcc_std,
        [
            spectral_centroid,
            spectral_bandwidth,
            zero_crossing_rate
        ]
    ])

    return features.reshape(1, -1)


# ============================================================
# AI PREDICTION
# ============================================================

def predict_for_api(file_path):

    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(
            f"Audio file not found: {file_path}"
        )

    # Check model exists
    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_FILE}"
        )

    # Load trained model
    model = joblib.load(
        MODEL_FILE
    )

    # Load audio
    audio, sr = librosa.load(
        file_path,
        sr=None,
        mono=True
    )

    # Preprocess
    audio = preprocess_audio(
        audio,
        sr
    )

    # Extract 29 features
    features = extract_features(
        audio,
        sr
    )

    # Prediction
    prediction = model.predict(
        features
    )[0]

    # Probabilities
    probabilities = model.predict_proba(
        features
    )[0]

    classes = model.classes_

    probability_map = dict(
        zip(
            classes,
            probabilities
        )
    )

    # Confidence = probability of predicted class
    confidence = probability_map[
        prediction
    ]

    return {
        "prediction": str(prediction),
        "confidence": float(confidence),
        "sampling_rate": int(sr),
        "duration": round(
            len(audio) / sr,
            2
        )
    }


# ============================================================
# COMMAND-LINE PREDICTION
# ============================================================

def predict(file_path):

    result = predict_for_api(
        file_path
    )

    print("=" * 60)
    print("ECHOASSIST AI ANALYSIS")
    print("=" * 60)

    print(
        "File:",
        file_path
    )

    print(
        "Sampling rate:",
        result["sampling_rate"]
    )

    print(
        "Duration:",
        result["duration"],
        "seconds"
    )

    print()

    print("=" * 60)
    print("RESULT")
    print("=" * 60)

    print(
        "Prediction:",
        result["prediction"].upper()
    )

    print(
        "Confidence:",
        f"{result['confidence'] * 100:.2f}%"
    )

    print(
        "Model: EchoAssist v1"
    )

    print("=" * 60)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            "Usage:"
        )

        print(
            "python ml\\inference\\predict.py <wav_file>"
        )

        sys.exit(1)

    predict(
        sys.argv[1]
    )