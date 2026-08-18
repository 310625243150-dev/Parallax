import pytest
from services.ml_adapter import set_ml_adapter, RealMLAdapter


@pytest.fixture(autouse=True)
def use_real_ml_adapter():
    """Ensure RealMLAdapter is active for integration tests."""
    set_ml_adapter(RealMLAdapter())
    yield
    set_ml_adapter(RealMLAdapter())


def test_real_ml_pipeline_valid_wav(client):
    """Test POST /api/examinations/analyze end-to-end with real WAV file and real ML model."""
    # 1. Create patient
    patient_res = client.post("/api/patients", json={
        "id": "PAT-REAL-001",
        "name": "Integration Patient",
        "age": 52,
        "gender": "Female"
    })
    assert patient_res.status_code == 201

    # 2. Analyze real sample WAV file
    analyze_payload = {
        "patient_id": "PAT-REAL-001",
        "audio_reference": "Audio/input/a0001.wav",
        "notes": "Real ML integration test"
    }
    response = client.post("/api/examinations/analyze", json=analyze_payload)
    assert response.status_code == 201
    data = response.json()

    # 3. Verify examination output structure
    assert "examination" in data
    exam = data["examination"]
    assert exam["patient_id"] == "PAT-REAL-001"
    assert exam["audio_reference"] == "Audio/input/a0001.wav"
    assert exam["diagnosis"] in ["Normal Heart Sound", "Abnormal Heart Sound"]
    assert isinstance(exam["confidence"], float)
    assert 0.0 <= exam["confidence"] <= 1.0
    assert exam["signal_quality"] in ["Good", "Fair", "Poor"]
    assert exam["model_version"] == "v1.0.0-rf"

    # 4. Verify comparison output structure
    assert "comparison" in data
    comp = data["comparison"]
    assert comp["patient_id"] == "PAT-REAL-001"
    assert comp["has_previous"] is False


def test_real_ml_pipeline_missing_audio_file(client):
    """Test 404 error returned when audio file is missing or invalid."""
    client.post("/api/patients", json={"id": "PAT-REAL-002", "name": "Bob", "age": 30})

    analyze_payload = {
        "patient_id": "PAT-REAL-002",
        "audio_reference": "non_existent_file_12345.wav"
    }
    response = client.post("/api/examinations/analyze", json=analyze_payload)
    assert response.status_code == 404
    assert "Audio file not found" in response.json()["detail"]


def test_real_ml_pipeline_history_and_comparison(client):
    """Test persistence, history, and longitudinal comparison using real ML analysis."""
    client.post("/api/patients", json={"id": "PAT-REAL-003", "name": "Charlie", "age": 60})

    # Analyze first exam
    res1 = client.post("/api/examinations/analyze", json={
        "patient_id": "PAT-REAL-003",
        "audio_reference": "Audio/input/a0001.wav",
        "notes": "First exam"
    })
    assert res1.status_code == 201

    # Analyze second exam
    res2 = client.post("/api/examinations/analyze", json={
        "patient_id": "PAT-REAL-003",
        "audio_reference": "Audio/input/a0001.wav",
        "notes": "Second exam"
    })
    assert res2.status_code == 201

    # Verify history endpoint
    hist_res = client.get("/api/patients/PAT-REAL-003/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 2
    assert history[0]["notes"] == "First exam"
    assert history[1]["notes"] == "Second exam"

    # Verify comparison endpoint
    comp_res = client.get("/api/patients/PAT-REAL-003/comparison")
    assert comp_res.status_code == 200
    comparison = comp_res.json()
    assert comparison["has_previous"] is True
    assert comparison["current_diagnosis"] in ["Normal Heart Sound", "Abnormal Heart Sound"]
