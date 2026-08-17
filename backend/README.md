# EchoAssist / Parallax Backend API

Senior Backend & Database Engineering implementation by **SAIRAM (Member 2)**.

This service delivers a high-performance RESTful API for patient management, medical audio auscultation analysis, examination history tracking, and temporal diagnostic comparison.

---

## 🛠️ Stack & Architecture

- **Language & Framework**: Python 3.12+, FastAPI
- **Database**: SQLite with SQLAlchemy 2.0 ORM
- **Validation & Serialization**: Pydantic v2
- **ASGI Web Server**: Uvicorn
- **Testing**: Pytest & HTTPX TestClient

### Project Layout

```text
backend/
├── main.py                   # FastAPI application initialization & CORS
├── database/
│   ├── __init__.py
│   └── database.py           # SQLAlchemy engine, session maker, base & DB dependency
├── models/
│   ├── __init__.py
│   ├── patient.py            # Patient database table schema
│   └── examination.py        # Examination database table schema
├── schemas/
│   ├── __init__.py
│   ├── patient.py            # Pydantic schemas for Patient CRUD
│   ├── examination.py        # Pydantic schemas for Examination requests/responses
│   └── comparison.py         # Pydantic schemas for diagnostic comparison
├── routes/
│   ├── __init__.py
│   ├── patients.py           # /api/patients endpoints & sub-routes
│   └── examinations.py       # /api/examinations/analyze endpoint
├── services/
│   ├── __init__.py
│   ├── patient_service.py    # Business logic & DB access for patients
│   ├── examination_service.py# Business logic for analysis, history & comparison
│   └── ml_adapter.py         # Isolated ML model interface & dev mock adapter
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Pytest fixtures & isolated in-memory DB client
│   └── test_api.py           # Automated test suite
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Execution

### 1. Virtual Environment Setup

Using the workspace virtual environment:

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### 2. Running the Development Server

Start the server from the `backend/` directory:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- **Base URL**: `http://127.0.0.1:8000`
- **Interactive OpenAPI (Swagger) Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 🧪 Running Automated Tests

Run the test suite with Pytest:

```bash
pytest tests/ -v
```

All tests execute against an isolated in-memory SQLite database (`sqlite:///:memory:`).

---

## 📌 API Reference

### 1. Create Patient
- **Endpoint**: `POST /api/patients`
- **Request Body**:
  ```json
  {
    "id": "PAT-1001",
    "name": "Sairam",
    "age": 28,
    "gender": "Male",
    "medical_history": "Routine checkup"
  }
  ```
- **Response**: `201 Created`

### 2. Get All Patients
- **Endpoint**: `GET /api/patients`
- **Response**: `200 OK` (Array of patients)

### 3. Get Single Patient
- **Endpoint**: `GET /api/patients/{patient_id}`
- **Response**: `200 OK` (or `404 Not Found`)

### 4. Analyze Examination Audio
- **Endpoint**: `POST /api/examinations/analyze`
- **Request Body**:
  ```json
  {
    "patient_id": "PAT-1001",
    "audio_reference": "cardiac_audio_sample_01.wav",
    "notes": "Apical 4-chamber auscultation"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "examination": {
      "id": 1,
      "patient_id": "PAT-1001",
      "timestamp": "2026-08-17T22:50:00",
      "audio_reference": "cardiac_audio_sample_01.wav",
      "diagnosis": "Mitral Regurgitation",
      "confidence": 0.89,
      "signal_quality": "Good",
      "model_version": "v1.0.0-mock",
      "notes": "Apical 4-chamber auscultation"
    },
    "comparison": {
      "patient_id": "PAT-1001",
      "has_previous": false,
      "previous_diagnosis": null,
      "previous_confidence": null,
      "current_diagnosis": "Mitral Regurgitation",
      "current_confidence": 0.89,
      "change_detected": false,
      "details": "First recorded examination. No prior examination exists for comparison."
    }
  }
  ```

### 5. Get Patient History
- **Endpoint**: `GET /api/patients/{patient_id}/history`
- **Response**: `200 OK` (Chronological array of all past examinations)

### 6. Compare Examinations
- **Endpoint**: `GET /api/patients/{patient_id}/comparison`
- **Response**: `200 OK` (Comparison between latest and previous examination)

---

## 🤖 ML Integration (For Member 3 / ML Teammate)

The ML integration is decoupled and cleanly isolated in [`services/ml_adapter.py`](file:///c:/Users/saira/OneDrive/Desktop/BACKEND/Parallax/backend/services/ml_adapter.py).

- Currently uses `MockMLAdapter` for development and testing.
- To integrate the real ML model, subclass `BaseMLAdapter` or update `get_ml_adapter()` to call your model's inference code.
- Return contract required by backend:
  ```python
  {
      "diagnosis": str,       # e.g., "Normal Heart Sound", "Mitral Regurgitation"
      "confidence": float,     # float between 0.0 and 1.0
      "signal_quality": str,   # e.g., "High", "Good", "Medium", "Low"
      "model_version": str     # e.g., "v2.1.0-resnet"
  }
  ```

---

## 📝 Assumptions & Notes

1. **Patient IDs**: If `id` is supplied in `POST /api/patients`, it is sanitized and used as the primary key. If omitted, a unique `PAT-<HEX>` ID is generated automatically.
2. **Audio Files**: Audio is referenced by filename/URI string (`audio_reference`). Raw audio bytes are stored on disk or storage services, not directly inside SQLite.
3. **Comparison Logic**: A `change_detected` flag is set to `true` if the primary diagnosis string changes OR if diagnostic confidence shifts by 0.05 or more.
