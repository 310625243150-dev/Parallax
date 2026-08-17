import pytest


def test_root_endpoint(client):
    """Test standard health root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "service" in data


def test_create_and_get_patient(client):
    """Test patient creation and retrieval APIs."""
    # Create patient with explicit ID
    patient_data = {
        "id": "PAT-1001",
        "name": "John Doe",
        "age": 45,
        "gender": "Male",
        "medical_history": "Hypertension"
    }
    response = client.post("/api/patients", json=patient_data)
    assert response.status_code == 201
    created = response.json()
    assert created["id"] == "PAT-1001"
    assert created["name"] == "John Doe"

    # Get single patient
    response = client.get("/api/patients/PAT-1001")
    assert response.status_code == 200
    fetched = response.json()
    assert fetched["name"] == "John Doe"

    # Get all patients
    response = client.get("/api/patients")
    assert response.status_code == 200
    all_patients = response.json()
    assert len(all_patients) == 1
    assert all_patients[0]["id"] == "PAT-1001"


def test_create_patient_auto_id(client):
    """Test creating patient with automatically generated ID."""
    patient_data = {
        "name": "Jane Smith",
        "age": 32,
        "gender": "Female"
    }
    response = client.post("/api/patients", json=patient_data)
    assert response.status_code == 201
    created = response.json()
    assert created["id"].startswith("PAT-")
    assert created["name"] == "Jane Smith"


def test_duplicate_patient_id(client):
    """Test conflict error on duplicate patient ID creation."""
    patient_data = {"id": "PAT-DUP", "name": "Alice", "age": 30}
    response1 = client.post("/api/patients", json=patient_data)
    assert response1.status_code == 201

    response2 = client.post("/api/patients", json=patient_data)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]


def test_nonexistent_patient_404(client):
    """Test HTTP 404 response for nonexistent patient."""
    response = client.get("/api/patients/PAT-NOTFOUND")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_patient_validation_error(client):
    """Test validation errors for invalid payload."""
    # Negative age
    invalid_data = {"name": "Bob", "age": -5}
    response = client.post("/api/patients", json=invalid_data)
    assert response.status_code == 422

    # Missing required name
    invalid_data_2 = {"age": 50}
    response2 = client.post("/api/patients", json=invalid_data_2)
    assert response2.status_code == 422


def test_examination_analysis_workflow(client):
    """Test POST /api/examinations/analyze workflow end-to-end."""
    # Create patient
    client.post("/api/patients", json={"id": "PAT-EXAM-1", "name": "Sarah Connor", "age": 40})

    # Analyze examination
    analyze_payload = {
        "patient_id": "PAT-EXAM-1",
        "audio_reference": "cardiac_sample_murmur.wav",
        "notes": "Routine checkup"
    }
    response = client.post("/api/examinations/analyze", json=analyze_payload)
    assert response.status_code == 201
    data = response.json()

    # Verify examination object
    assert "examination" in data
    exam = data["examination"]
    assert exam["patient_id"] == "PAT-EXAM-1"
    assert exam["audio_reference"] == "cardiac_sample_murmur.wav"
    assert exam["diagnosis"] == "Mitral Regurgitation"
    assert exam["confidence"] == 0.89
    assert exam["signal_quality"] == "Good"
    assert exam["model_version"] == "v1.0.0-mock"

    # Verify comparison object
    assert "comparison" in data
    comp = data["comparison"]
    assert comp["patient_id"] == "PAT-EXAM-1"
    assert comp["has_previous"] is False
    assert comp["current_diagnosis"] == "Mitral Regurgitation"


def test_examination_analyze_nonexistent_patient(client):
    """Test 404 error when analyzing audio for nonexistent patient."""
    analyze_payload = {
        "patient_id": "PAT-GHOST",
        "audio_reference": "sample.wav"
    }
    response = client.post("/api/examinations/analyze", json=analyze_payload)
    assert response.status_code == 404


def test_patient_history_api(client):
    """Test GET /api/patients/{patient_id}/history returning chronological history."""
    client.post("/api/patients", json={"id": "PAT-HIST-1", "name": "Tim Cook", "age": 60})

    # Create two examinations
    client.post("/api/examinations/analyze", json={"patient_id": "PAT-HIST-1", "audio_reference": "sample_normal.wav"})
    client.post("/api/examinations/analyze", json={"patient_id": "PAT-HIST-1", "audio_reference": "sample_murmur.wav"})

    response = client.get("/api/patients/PAT-HIST-1/history")
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 2
    assert history[0]["audio_reference"] == "sample_normal.wav"
    assert history[1]["audio_reference"] == "sample_murmur.wav"


def test_patient_history_nonexistent(client):
    """Test 404 on history for non-existent patient."""
    response = client.get("/api/patients/NOBODY/history")
    assert response.status_code == 404


def test_patient_comparison_api(client):
    """Test GET /api/patients/{patient_id}/comparison across 0, 1, and 2+ examinations."""
    client.post("/api/patients", json={"id": "PAT-COMP-1", "name": "Grace Hopper", "age": 70})

    # Case 0 examinations
    res0 = client.get("/api/patients/PAT-COMP-1/comparison")
    assert res0.status_code == 200
    comp0 = res0.json()
    assert comp0["has_previous"] is False
    assert "No examinations found" in comp0["details"]

    # Case 1 examination
    client.post("/api/examinations/analyze", json={"patient_id": "PAT-COMP-1", "audio_reference": "sound1_normal.wav"})
    res1 = client.get("/api/patients/PAT-COMP-1/comparison")
    assert res1.status_code == 200
    comp1 = res1.json()
    assert comp1["has_previous"] is False
    assert comp1["current_diagnosis"] == "Normal Heart Sound"

    # Case 2 examinations (change detected)
    client.post("/api/examinations/analyze", json={"patient_id": "PAT-COMP-1", "audio_reference": "sound2_murmur.wav"})
    res2 = client.get("/api/patients/PAT-COMP-1/comparison")
    assert res2.status_code == 200
    comp2 = res2.json()
    assert comp2["has_previous"] is True
    assert comp2["previous_diagnosis"] == "Normal Heart Sound"
    assert comp2["current_diagnosis"] == "Mitral Regurgitation"
    assert comp2["change_detected"] is True
    assert "Diagnosis changed" in comp2["details"]


def test_patient_comparison_nonexistent(client):
    """Test 404 on comparison for non-existent patient."""
    response = client.get("/api/patients/NOBODY/comparison")
    assert response.status_code == 404
