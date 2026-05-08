from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app import models  # noqa: F401 - ensure models are registered with metadata
from app.seed import seed_data
from app.routers import providers, presets, runs


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_data()
    yield


app = FastAPI(title="AI Workbench API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router)
app.include_router(presets.router)
app.include_router(runs.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
