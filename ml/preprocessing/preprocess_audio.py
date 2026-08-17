import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt

# --------------------------------------------------
# FILE PATHS
# --------------------------------------------------

INPUT_FILE = "ml/samples/a0001.wav"
OUTPUT_FILE = "ml/samples/a0001_processed.wav"


# --------------------------------------------------
# 1. LOAD AUDIO
# --------------------------------------------------

audio, sample_rate = sf.read(INPUT_FILE)

print("===== PREPROCESSING =====")
print("Input file:", INPUT_FILE)
print("Sampling rate:", sample_rate, "Hz")
print("Original samples:", len(audio))


# --------------------------------------------------
# 2. CONVERT TO MONO IF NECESSARY
# --------------------------------------------------

if audio.ndim > 1:
    audio = np.mean(audio, axis=1)

print("Channels: Mono")


# --------------------------------------------------
# 3. REMOVE DC OFFSET
# --------------------------------------------------

audio = audio - np.mean(audio)


# --------------------------------------------------
# 4. BAND-PASS FILTER
# --------------------------------------------------
# Keep frequencies approximately between
# 20 Hz and 400 Hz.

low_cutoff = 20
high_cutoff = 400

sos = butter(
    4,
    [low_cutoff, high_cutoff],
    btype="bandpass",
    fs=sample_rate,
    output="sos"
)

filtered_audio = sosfiltfilt(sos, audio)


# --------------------------------------------------
# 5. NORMALIZE AMPLITUDE
# --------------------------------------------------

max_amplitude = np.max(np.abs(filtered_audio))

if max_amplitude > 0:
    normalized_audio = filtered_audio / max_amplitude
else:
    normalized_audio = filtered_audio


# --------------------------------------------------
# 6. SAVE PROCESSED AUDIO
# --------------------------------------------------

sf.write(
    OUTPUT_FILE,
    normalized_audio,
    sample_rate
)


# --------------------------------------------------
# 7. PRINT RESULTS
# --------------------------------------------------

print("Filtering: 20-400 Hz")
print("Normalization: Applied")
print("Output file:", OUTPUT_FILE)
print("Processed samples:", len(normalized_audio))
print("Preprocessing completed successfully!")