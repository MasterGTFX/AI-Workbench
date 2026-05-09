import logging
import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlmodel import Session

from app.database import get_session
from app import crud, schemas

router = APIRouter(prefix="/api/providers", tags=["providers"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[schemas.ProviderResponse])
def read_providers(session: Session = Depends(get_session)):
    return crud.get_providers(session)


@router.post("/", response_model=schemas.ProviderResponse)
def create_provider(
    provider: schemas.ProviderCreate, session: Session = Depends(get_session)
):
    return crud.create_provider(session, provider)


@router.get("/{provider_id}", response_model=schemas.ProviderResponse)
def read_provider(provider_id: int, session: Session = Depends(get_session)):
    db_provider = crud.get_provider(session, provider_id)
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return db_provider


@router.put("/{provider_id}", response_model=schemas.ProviderResponse)
def update_provider(
    provider_id: int,
    provider: schemas.ProviderUpdate,
    session: Session = Depends(get_session),
):
    db_provider = crud.get_provider(session, provider_id)
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return crud.update_provider(session, db_provider, provider)


@router.delete("/{provider_id}")
def delete_provider(provider_id: int, session: Session = Depends(get_session)):
    db_provider = crud.get_provider(session, provider_id)
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    crud.delete_provider(session, db_provider)
    return {"ok": True}


@router.post("/{provider_id}/activate", response_model=schemas.ProviderResponse)
def activate_provider(
    provider_id: int, session: Session = Depends(get_session)
):
    db_provider = crud.get_provider(session, provider_id)
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return crud.activate_provider(session, provider_id)


@router.get("/{provider_id}/models", response_model=List[schemas.ModelItem])
def list_provider_models(
    provider_id: int, session: Session = Depends(get_session)
):
    provider = crud.get_provider(session, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    api_key = provider.api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Provider '{provider.name}' has no API key configured. "
                "Save an API key in Settings first."
            ),
        )

    if "localhost:11434" in provider.base_url:
        raise HTTPException(
            status_code=400,
            detail=(
                "Provider base URL points to localhost:11434. Inside Docker, localhost is the backend container. "
                "Use http://host.docker.internal:11434/v1 instead, or expose Ollama on the Docker network."
            ),
        )

    try:
        client = OpenAI(
            base_url=provider.base_url,
            api_key=api_key,
        )
        models = client.models.list()
        return [{"id": m.id} for m in models.data]
    except Exception as e:
        logger.exception("Failed to fetch provider models", extra={"provider_id": provider_id})
        raise HTTPException(status_code=400, detail=f"Failed to fetch models: {str(e)}")
