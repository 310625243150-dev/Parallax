from pathlib import Path

from loader import load_audio
from quality import assess_quality


project_root = Path(__file__).resolve().parent.parent

audio_file = project_root / "input" / "a0001.wav"

print("Loading:", audio_file)

audio, sample_rate = load_audio(audio_file)

result = assess_quality(audio, sample_rate)

print("\nSIGNAL QUALITY ASSESSMENT")
print("-------------------------")

for key, value in result.items():
    print(f"{key}: {value}")
    