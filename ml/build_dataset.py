import os
import numpy as np
import pandas as pd
import librosa
from scipy.signal import butter, sosfiltfilt

# ============================================================
# CONFIGURATION
# ============================================================

DATASET_DIR = "ml/data/physionet/training"
OUTPUT_FILE = "ml/data/physionet_dataset.csv"

LOWCUT = 20
HIGHCUT = 400


# ============================================================
# LABEL READING
# ============================================================

def read_label_file(path):
    if not os.path.exists(path):
        return set()

    with open(path, "r") as f:
        return {
            line.strip()
            for line in f
            if line.strip()
        }


def load_labels(folder):
    normal = read_label_file(
        os.path.join(folder, "RECORDS-normal")
    )

    abnormal = read_label_file(
        os.path.join(folder, "RECORDS-abnormal")
    )

    return normal, abnormal


# ============================================================
# AUDIO PREPROCESSING
# ============================================================

def preprocess_audio(audio, sr):
    nyquist = sr / 2

    highcut = min(HIGHCUT, nyquist * 0.9)

    if LOWCUT >= highcut:
        return audio

    sos = butter(
        4,
        [LOWCUT, highcut],
        btype="bandpass",
        fs=sr,
        output="sos"
    )

    filtered = sosfiltfilt(sos, audio)

    # Normalize
    max_value = np.max(np.abs(filtered))

    if max_value > 0:
        filtered = filtered / max_value

    return filtered


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def extract_features(audio, sr):

    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sr,
        n_mfcc=13
    )

    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)

    spectral_centroid = np.mean(
        librosa.feature.spectral_centroid(
            y=audio,
            sr=sr
        )
    )

    spectral_bandwidth = np.mean(
        librosa.feature.spectral_bandwidth(
            y=audio,
            sr=sr
        )
    )

    zero_crossing_rate = np.mean(
        librosa.feature.zero_crossing_rate(audio)
    )

    features = np.concatenate([
        mfcc_mean,
        mfcc_std,
        [
            spectral_centroid,
            spectral_bandwidth,
            zero_crossing_rate
        ]
    ])

    return features


# ============================================================
# PROCESS ONE FOLDER
# ============================================================

def process_folder(folder):

    print()
    print("=" * 60)
    print("Processing:", folder)
    print("=" * 60)

    normal, abnormal = load_labels(folder)

    wav_files = [
        f for f in os.listdir(folder)
        if f.lower().endswith(".wav")
    ]

    print("WAV files:", len(wav_files))
    print("Normal labels:", len(normal))
    print("Abnormal labels:", len(abnormal))

    rows = []

    for index, filename in enumerate(wav_files, start=1):

        path = os.path.join(folder, filename)

        try:

            audio, sr = librosa.load(
                path,
                sr=None,
                mono=True
            )

            audio = preprocess_audio(audio, sr)

            features = extract_features(
                audio,
                sr
            )

            record_name = os.path.splitext(
                filename
            )[0]

            # PhysioNet RECORDS files may contain
            # record names without extensions.
            if record_name in normal:
                label = "normal"

            elif record_name in abnormal:
                label = "abnormal"

            elif filename in normal:
                label = "normal"

            elif filename in abnormal:
                label = "abnormal"

            else:
                print(
                    "WARNING: No label for",
                    filename
                )
                continue

            row = {
                "filename": filename,
                "label": label
            }

            for i, value in enumerate(features):
                row[f"feature_{i+1}"] = float(value)

            rows.append(row)

            if index % 25 == 0:
                print(
                    f"Processed {index}/{len(wav_files)}"
                )

        except Exception as e:

            print(
                "ERROR:",
                filename,
                "->",
                e
            )

    return rows


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("ECHOASSIST DATASET BUILDER")
    print("=" * 60)

    all_rows = []

    folders = [
        os.path.join(
            DATASET_DIR,
            name
        )
        for name in sorted(
            os.listdir(DATASET_DIR)
        )
        if name.startswith("training-")
        and os.path.isdir(
            os.path.join(DATASET_DIR, name)
        )
    ]

    print("Training folders found:", len(folders))

    for folder in folders:

        rows = process_folder(folder)

        all_rows.extend(rows)

    if not all_rows:
        print()
        print("ERROR: No recordings processed.")
        return

    df = pd.DataFrame(all_rows)

    # Put label first
    columns = (
        ["filename"]
        + [
            c for c in df.columns
            if c.startswith("feature_")
        ]
        + ["label"]
    )

    df = df[columns]

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("=" * 60)
    print("DATASET BUILD COMPLETE")
    print("=" * 60)

    print("Total recordings:", len(df))
    print()
    print("Label distribution:")
    print(df["label"].value_counts())

    print()
    print("Saved to:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    main()