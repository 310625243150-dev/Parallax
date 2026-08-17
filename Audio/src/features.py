from pathlib import Path

import librosa
import numpy as np


def extract_features(audio_path):
    """
    Extract numerical audio features for the ML model.
    """

    audio, sample_rate = librosa.load(
        str(audio_path),
        sr=None,
        mono=True
    )

    # MFCC features
    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sample_rate,
        n_mfcc=13
    )

    # Spectral centroid
    spectral_centroid = librosa.feature.spectral_centroid(
        y=audio,
        sr=sample_rate
    )

    # Spectral bandwidth
    spectral_bandwidth = librosa.feature.spectral_bandwidth(
        y=audio,
        sr=sample_rate
    )

    # Zero crossing rate
    zero_crossing_rate = librosa.feature.zero_crossing_rate(
        audio
    )

    # RMS energy
    rms = librosa.feature.rms(
        y=audio
    )

    # Convert each feature into a fixed-size number
    # by taking the mean across time.
    mfcc_mean = np.mean(mfcc, axis=1)

    centroid_mean = np.mean(spectral_centroid)

    bandwidth_mean = np.mean(spectral_bandwidth)

    zcr_mean = np.mean(zero_crossing_rate)

    rms_mean = np.mean(rms)

    # Combine everything into one feature vector
    feature_vector = np.concatenate([
        mfcc_mean,
        [centroid_mean],
        [bandwidth_mean],
        [zcr_mean],
        [rms_mean]
    ])

    return feature_vector


if __name__ == "__main__":

    project_root = Path(__file__).resolve().parent.parent

    audio_file = (
        project_root
        / "processed"
        / "a0001_processed.wav"
    )

    features = extract_features(audio_file)

    print("\nFEATURE EXTRACTION")
    print("------------------")

    print("Audio:", audio_file)
    print("Number of features:", len(features))

    print("\nFeature vector:")
    print(features)
    