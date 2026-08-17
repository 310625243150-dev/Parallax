from pathlib import Path
import librosa


def load_audio(file_path):
    """Load an audio recording."""

    audio, sample_rate = librosa.load(
        str(file_path),
        sr=None,
        mono=False
    )

    return audio, sample_rate


def get_audio_info(audio, sample_rate):
    """Get basic information about the audio."""

    if audio.ndim == 1:
        channels = 1
        samples = len(audio)
    else:
        channels = audio.shape[0]
        samples = audio.shape[-1]

    duration = samples / sample_rate

    return {
        "sample_rate": sample_rate,
        "channels": channels,
        "samples": samples,
        "duration": duration
    }


if __name__ == "__main__":

    # Project root = D:\EchoAssist\audio
    project_root = Path(__file__).resolve().parent.parent

    # Audio file = D:\EchoAssist\audio\input\a0001.wav
    file_path = project_root / "input" / "a0001.wav"

    print("Loading:", file_path)

    audio, sample_rate = load_audio(file_path)

    info = get_audio_info(audio, sample_rate)

    print("\nAUDIO INFORMATION")
    print("------------------")

    for key, value in info.items():
        print(f"{key}: {value}")