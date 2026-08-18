import librosa
import numpy as np

# --------------------------------------------------
# FILE
# --------------------------------------------------

INPUT_FILE = "ml/samples/a0001_processed.wav"


# --------------------------------------------------
# LOAD AUDIO
# --------------------------------------------------

audio, sample_rate = librosa.load(INPUT_FILE, sr=None)

print("===== FEATURE EXTRACTION =====")
print("File:", INPUT_FILE)
print("Sampling rate:", sample_rate, "Hz")
print("Duration:", round(len(audio) / sample_rate, 2), "seconds")


# --------------------------------------------------
# 1. MFCC FEATURES
# --------------------------------------------------

mfcc = librosa.feature.mfcc(
    y=audio,
    sr=sample_rate,
    n_mfcc=13
)

mfcc_mean = np.mean(mfcc, axis=1)
mfcc_std = np.std(mfcc, axis=1)


# --------------------------------------------------
# 2. SPECTRAL FEATURES
# --------------------------------------------------

spectral_centroid = librosa.feature.spectral_centroid(
    y=audio,
    sr=sample_rate
)

spectral_bandwidth = librosa.feature.spectral_bandwidth(
    y=audio,
    sr=sample_rate
)

zero_crossing_rate = librosa.feature.zero_crossing_rate(
    audio
)

# Convert each feature into a single value
spectral_centroid_mean = np.mean(spectral_centroid)
spectral_bandwidth_mean = np.mean(spectral_bandwidth)
zero_crossing_rate_mean = np.mean(zero_crossing_rate)


# --------------------------------------------------
# 3. CREATE FEATURE VECTOR
# --------------------------------------------------

feature_vector = np.concatenate([
    mfcc_mean,
    mfcc_std,
    [
        spectral_centroid_mean,
        spectral_bandwidth_mean,
        zero_crossing_rate_mean
    ]
])


# --------------------------------------------------
# 4. DISPLAY RESULTS
# --------------------------------------------------

print("\nMFCC mean:", mfcc_mean)
print("MFCC standard deviation:", mfcc_std)

print("\nSpectral centroid:", spectral_centroid_mean)
print("Spectral bandwidth:", spectral_bandwidth_mean)
print("Zero crossing rate:", zero_crossing_rate_mean)

print("\nTotal number of features:", len(feature_vector))

print("\nFeature vector:")
print(feature_vector)

print("\nFeature extraction completed successfully!")