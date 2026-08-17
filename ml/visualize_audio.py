import librosa
import matplotlib.pyplot as plt

audio_path = "ml/samples/a0001.wav"

audio, sample_rate = librosa.load(audio_path, sr=None)

time = [i / sample_rate for i in range(len(audio))]

plt.figure(figsize=(12, 4))
plt.plot(time, audio)

plt.title("Heart Sound Waveform - a0001.wav")
plt.xlabel("Time (seconds)")
plt.ylabel("Amplitude")

plt.tight_layout()
plt.show()