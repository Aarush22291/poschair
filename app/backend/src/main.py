import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import profile, calibration, sessions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PosChair API", version="1.0.0")

# CORS_ORIGINS env var lets docker-compose / production override without code changes.
# "null" allows Electron (file:// origin) and direct-open HTML files.
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,null"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router,     prefix="/profile",     tags=["Profile"])
app.include_router(calibration.router, prefix="/calibration", tags=["Calibration"])
app.include_router(sessions.router,    prefix="/sessions",    tags=["Sessions"])

@app.get("/health")
def health(): return {"status": "ok"}
