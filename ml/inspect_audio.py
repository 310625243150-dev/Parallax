import librosa

audio_path = "ml/samples/a0001.wav"

audio, sample_rate = librosa.load(audio_path, sr=None)

duration = len(audio) / sample_rate

print("===== AUDIO INFORMATION =====")
print("File:", audio_path)
print("Sampling rate:", sample_rate, "Hz")
print("Number of samples:", len(audio))
print("Duration:", round(duration, 2), "seconds")
print("Audio loaded successfully!")