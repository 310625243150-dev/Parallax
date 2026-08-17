import numpy as np


def assess_quality(audio, sample_rate):
    """
    Basic signal-quality assessment.
    """

    # Convert stereo to mono
    if audio.ndim > 1:
        audio = np.mean(audio, axis=0)

    # 1. Duration
    duration = len(audio) / sample_rate

    if duration >= 10:
        duration_score = 100
        duration_status = "PASS"
    elif duration >= 5:
        duration_score = 60
        duration_status = "WARNING"
    else:
        duration_score = 20
        duration_status = "FAIL"

    # 2. Amplitude
    rms = np.sqrt(np.mean(audio ** 2))

    if rms > 0.01:
        amplitude_status = "PASS"
        amplitude_score = 100
    else:
        amplitude_status = "WARNING"
        amplitude_score = 40

    # 3. Clipping
    clipping_ratio = np.mean(np.abs(audio) >= 0.99)

    if clipping_ratio < 0.001:
        clipping_status = "PASS"
        clipping_score = 100
    else:
        clipping_status = "WARNING"
        clipping_score = 40

    # 4. Silence
    silence_ratio = np.mean(np.abs(audio) < 0.005)

    if silence_ratio < 0.5:
        silence_status = "PASS"
        silence_score = 100
    elif silence_ratio < 0.8:
        silence_status = "WARNING"
        silence_score = 60
    else:
        silence_status = "FAIL"
        silence_score = 20

    # Overall score
    overall_score = (
        duration_score * 0.25
        + amplitude_score * 0.25
        + clipping_score * 0.25
        + silence_score * 0.25
    )

    if overall_score >= 75:
        overall_status = "GOOD"
    elif overall_score >= 50:
        overall_status = "FAIR"
    else:
        overall_status = "POOR"

    return {
        "overall_score": round(overall_score, 2),
        "overall_status": overall_status,

        "duration": round(duration, 2),
        "duration_status": duration_status,

        "rms": round(float(rms), 5),
        "amplitude_status": amplitude_status,

        "clipping_ratio": round(float(clipping_ratio), 5),
        "clipping_status": clipping_status,

        "silence_ratio": round(float(silence_ratio), 5),
        "silence_status": silence_status,
    }