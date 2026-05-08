from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app import crud, schemas, llm
from app.models import Run

router = APIRouter(prefix="/api/presets", tags=["presets"])


@router.get("/", response_model=List[schemas.PresetResponse])
def read_presets(session: Session = Depends(get_session)):
    return crud.get_presets(session)


@router.post("/", response_model=schemas.PresetResponse)
def create_preset(
    preset: schemas.PresetCreate, session: Session = Depends(get_session)
):
    return crud.create_preset(session, preset)


@router.get("/{preset_id}", response_model=schemas.PresetResponse)
def read_preset(preset_id: int, session: Session = Depends(get_session)):
    db_preset = crud.get_preset(session, preset_id)
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return db_preset


@router.put("/{preset_id}", response_model=schemas.PresetResponse)
def update_preset(
    preset_id: int,
    preset: schemas.PresetUpdate,
    session: Session = Depends(get_session),
):
    db_preset = crud.get_preset(session, preset_id)
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return crud.update_preset(session, db_preset, preset)


@router.delete("/{preset_id}")
def delete_preset(preset_id: int, session: Session = Depends(get_session)):
    db_preset = crud.get_preset(session, preset_id)
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    crud.delete_preset(session, db_preset)
    return {"ok": True}


@router.post("/{preset_id}/duplicate", response_model=schemas.PresetResponse)
def duplicate_preset(preset_id: int, session: Session = Depends(get_session)):
    db_preset = crud.get_preset(session, preset_id)
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return crud.duplicate_preset(session, db_preset)


@router.post("/{preset_id}/run", response_model=schemas.RunResponse)
def run_preset(
    preset_id: int,
    request: schemas.RunExecuteRequest,
    session: Session = Depends(get_session),
):
    db_preset = crud.get_preset(session, preset_id)
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    if not db_preset.provider_id:
        raise HTTPException(status_code=400, detail="Preset has no provider configured")

    provider = crud.get_provider(session, db_preset.provider_id)
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not found")

    model = db_preset.model
    if request.overrides and request.overrides.model:
        model = request.overrides.model

    run = Run(
        preset_id=preset_id,
        input=request.input,
        status="pending",
        model=model,
    )
    run = crud.create_run(session, run)

    try:
        overrides = (
            request.overrides.model_dump(exclude_unset=True)
            if request.overrides
            else None
        )
        result = llm.call_llm(
            provider, db_preset, request.input, db_preset.schema_fields, overrides
        )

        run.status = "success"
        run.output = result["output"]
        run.raw_response = result["raw_response"]
        run.duration_ms = result["duration_ms"]
        run.tokens_prompt = result["tokens_prompt"]
        run.tokens_completion = result["tokens_completion"]
    except Exception as e:
        run.status = "failed"
        run.error = str(e)

    session.add(run)
    session.commit()
    session.refresh(run)

    return crud.get_run(session, run.id)
