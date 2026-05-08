from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app import crud, schemas, llm
from app.models import Run

router = APIRouter(prefix="/api/presets", tags=["presets"])


@router.post("/generate/", response_model=schemas.PresetGenerateResponse)
def generate_preset(
    request: schemas.PresetGenerateRequest,
    session: Session = Depends(get_session),
):
    provider = None
    if request.provider_id:
        provider = crud.get_provider(session, request.provider_id)
    else:
        # Use first active provider as default
        providers = crud.get_providers(session)
        for p in providers:
            if p.active:
                provider = p
                break
        if not provider and providers:
            provider = providers[0]

    if not provider:
        raise HTTPException(status_code=400, detail="No provider configured. Add a provider first.")

    try:
        result = llm.generate_preset_draft(provider, request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    # Validate and map schema field types
    valid_types = {
        "string", "number", "integer", "boolean", "enum",
        "list[string]", "list[number]", "object", "list[object]",
    }
    schema_fields = []
    for idx, f in enumerate(result.get("schema_fields", [])):
        field_type = f.get("type", "string")
        if field_type not in valid_types:
            field_type = "string"
        schema_fields.append(
            schemas.SchemaFieldCreate(
                name=f.get("name", f"field_{idx}"),
                type=field_type,
                required=f.get("required", True),
                description=f.get("description") or None,
                enum_values=f.get("enum_values") or None,
                validation_hint=f.get("validation_hint") or None,
                example=f.get("example") or None,
                default_value=f.get("default_value") or None,
                order=idx,
            )
        )

    return schemas.PresetGenerateResponse(
        name=result.get("name", "Generated Preset"),
        description=result.get("description") or None,
        tags=result.get("tags", ""),
        system_prompt=result.get("system_prompt") or None,
        user_prompt_template=result.get("user_prompt_template", "Analyze: {{input}}"),
        model=result.get("model") or None,
        schema_fields=schema_fields,
    )


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

    # Resolve provider: run override > preset override > active provider
    provider_id = None
    if request.overrides and request.overrides.provider_id:
        provider_id = request.overrides.provider_id
    elif db_preset.provider_id:
        provider_id = db_preset.provider_id
    else:
        providers = crud.get_providers(session)
        for p in providers:
            if p.active:
                provider_id = p.id
                break
        if not provider_id and providers:
            provider_id = providers[0].id

    if not provider_id:
        raise HTTPException(status_code=400, detail="No provider configured. Add a provider or select one for this run.")

    provider = crud.get_provider(session, provider_id)
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not found")

    model = (
        (request.overrides and request.overrides.model)
        or db_preset.model
        or provider.default_model
        or ""
    )

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
