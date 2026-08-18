import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database.database import Base, get_db
from services.ml_adapter import set_ml_adapter, MockMLAdapter, RealMLAdapter

# Use in-memory SQLite database for test isolation
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for a test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session, request):
    """Return FastAPI TestClient with overridden database dependency."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    if "test_api.py" in str(request.node.fspath):
        set_ml_adapter(MockMLAdapter())
    else:
        set_ml_adapter(RealMLAdapter())

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


