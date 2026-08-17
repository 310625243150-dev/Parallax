from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, filtfilt


TARGET_SAMPLE_RATE = 2000


def bandpass_filter(audio, sample_rate, lowcut=20, highcut=800):

    nyquist = sample_rate / 2

    highcut = min(highcut, nyquist - 1)

    low = lowcut / nyquist
    high = highcut / nyquist

    b, a = butter(
        4,
        [low, high],
        btype="band"
    )

    return filtfilt(b, a, audio)


def normalize_audio(audio):

    peak = np.max(np.abs(audio))

    if peak == 0:
        return audio

    return audio / peak


def preprocess_audio(input_path, output_path):

    print("Loading:", input_path)

    audio, sample_rate = librosa.load(
        str(input_path),
        sr=None,
        mono=True
    )

    print(
        f"Original sample rate: {sample_rate} Hz"
    )

    if sample_rate != TARGET_SAMPLE_RATE:

        print(
            f"Resampling: {sample_rate} Hz -> "
            f"{TARGET_SAMPLE_RATE} Hz"
        )

        audio = librosa.resample(
            audio,
            orig_sr=sample_rate,
            target_sr=TARGET_SAMPLE_RATE
        )

        sample_rate = TARGET_SAMPLE_RATE

    print("Applying band-pass filter...")

    audio = bandpass_filter(
        audio,
        sample_rate
    )

    print("Normalizing audio...")

    audio = normalize_audio(audio)

    output_path = Path(output_path)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    sf.write(
        str(output_path),
        audio,
        sample_rate
    )

    print(
        "Processed audio saved to:"
    )

    print(output_path)

    return audio, sample_rate


if __name__ == "__main__":

    project_root = Path(
        __file__
    ).resolve().parent.parent

    input_file = (
        project_root
        / "input"
        / "a0001.wav"
    )

    output_file = (
        project_root
        / "processed"
        / "a0001_processed.wav"
    )

    preprocess_audio(
        input_file,
        output_file
    )