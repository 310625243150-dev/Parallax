from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, engine
from routes.patients import router as patients_router
from routes.examinations import router as examinations_router

# Import models so SQLAlchemy creates tables
import models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="EchoAssist Backend",
    description="Medical Auscultation & Diagnostic Analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local development and frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(patients_router)
app.include_router(examinations_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "EchoAssist Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }