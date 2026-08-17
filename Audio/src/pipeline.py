from pathlib import Path

from loader import load_audio
from quality import assess_quality
from preprocess import preprocess_audio
from features import extract_features


def run_pipeline(input_file):

    input_file = Path(input_file)

    project_root = Path(__file__).resolve().parent.parent

    processed_file = (
        project_root
        / "processed"
        / f"{input_file.stem}_processed.wav"
    )

    print()
    print("================================")
    print("      ECHOASSIST AUDIO PIPELINE")
    print("================================")

    # -----------------------------------------
    # STEP 1 — LOAD AUDIO
    # -----------------------------------------

    print()
    print("[1/4] Loading audio...")

    audio, sample_rate = load_audio(input_file)

    print(f"Sample rate : {sample_rate} Hz")
    print(f"Samples     : {len(audio)}")

    # -----------------------------------------
    # STEP 2 — QUALITY ASSESSMENT
    # -----------------------------------------

    print()
    print("[2/4] Assessing signal quality...")

    quality = assess_quality(
        audio,
        sample_rate
    )

    print(
        f"Quality score : "
        f"{quality['overall_score']}/100"
    )

    print(
        f"Quality status: "
        f"{quality['overall_status']}"
    )

    # -----------------------------------------
    # STOP IF QUALITY IS POOR
    # -----------------------------------------

    if quality["overall_status"] == "POOR":

        print()
        print("Recording quality is too poor.")
        print("Please record the heart sound again.")

        return {
            "status": "REJECTED",
            "quality": quality
        }

    # -----------------------------------------
    # STEP 3 — PREPROCESSING
    # -----------------------------------------

    print()
    print("[3/4] Preprocessing audio...")

    preprocess_audio(
        input_file,
        processed_file
    )

    # -----------------------------------------
    # STEP 4 — FEATURE EXTRACTION
    # -----------------------------------------

    print()
    print("[4/4] Extracting features...")

    features = extract_features(
        processed_file
    )

    print(
        f"Features extracted: "
        f"{len(features)}"
    )

    # -----------------------------------------
    # COMPLETE
    # -----------------------------------------

    print()
    print("================================")
    print("       PIPELINE COMPLETE")
    print("================================")

    print(
        f"Quality : "
        f"{quality['overall_status']}"
    )

    print(
        f"Features: "
        f"{len(features)}"
    )

    print(
        f"Output  : "
        f"{processed_file}"
    )

    return {
        "status": "SUCCESS",
        "quality": quality,
        "sample_rate": sample_rate,
        "processed_file": str(processed_file),
        "features": features
    }


if __name__ == "__main__":

    project_root = Path(
        __file__
    ).resolve().parent.parent

    input_file = (
        project_root
        / "input"
        / "a0001.wav"
    )

    result = run_pipeline(input_file)

    print()
    print("RESULT STATUS:", result["status"])