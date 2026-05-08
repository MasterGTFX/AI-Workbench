import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlmodel import Session

from app.database import get_session
from app import crud, schemas

router = APIRouter(prefix="/api/providers", tags=["providers"])


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
    try:
        client = OpenAI(
            base_url=provider.base_url,
            api_key=provider.api_key or os.environ.get("OPENAI_API_KEY", ""),
        )
        models = client.models.list()
        return [{"id": m.id} for m in models.data]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch models: {str(e)}")
