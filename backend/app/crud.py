from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.models import Provider, Preset, SchemaField, Run
from app.schemas import ProviderCreate, ProviderUpdate, PresetCreate, PresetUpdate


# Provider CRUD

def get_providers(session: Session) -> List[Provider]:
    statement = select(Provider)
    return list(session.exec(statement).all())


def get_provider(session: Session, provider_id: int) -> Optional[Provider]:
    return session.get(Provider, provider_id)


def activate_provider(session: Session, provider_id: int) -> Optional[Provider]:
    providers = get_providers(session)
    target = None
    for p in providers:
        if p.id == provider_id:
            p.active = True
            target = p
        else:
            p.active = False
        session.add(p)
    session.commit()
    if target:
        session.refresh(target)
    return target


def create_provider(session: Session, provider: ProviderCreate) -> Provider:
    db_provider = Provider(**provider.model_dump())
    session.add(db_provider)
    session.commit()
    session.refresh(db_provider)
    return db_provider


def update_provider(
    session: Session, db_provider: Provider, provider: ProviderUpdate
) -> Provider:
    update_data = provider.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_provider, key, value)
    db_provider.updated_at = datetime.utcnow()
    session.add(db_provider)
    session.commit()
    session.refresh(db_provider)
    return db_provider


def delete_provider(session: Session, db_provider: Provider) -> None:
    session.delete(db_provider)
    session.commit()


# Preset CRUD

def get_presets(session: Session) -> List[Preset]:
    statement = (
        select(Preset)
        .options(selectinload(Preset.schema_fields))
    )
    return list(session.exec(statement).all())


def get_preset(session: Session, preset_id: int) -> Optional[Preset]:
    statement = (
        select(Preset)
        .where(Preset.id == preset_id)
        .options(selectinload(Preset.schema_fields))
    )
    return session.exec(statement).first()


def get_preset_by_name(session: Session, name: str) -> Optional[Preset]:
    statement = (
        select(Preset)
        .where(Preset.name == name)
        .options(selectinload(Preset.schema_fields))
    )
    return session.exec(statement).first()


def create_preset(session: Session, preset: PresetCreate) -> Preset:
    schema_fields_data = preset.schema_fields
    preset_data = preset.model_dump(exclude={"schema_fields"})
    db_preset = Preset(**preset_data)
    session.add(db_preset)
    session.commit()
    session.refresh(db_preset)

    for field_data in schema_fields_data:
        db_field = SchemaField(preset_id=db_preset.id, **field_data.model_dump())
        session.add(db_field)
    session.commit()
    session.refresh(db_preset)
    return db_preset


def update_preset(session: Session, db_preset: Preset, preset: PresetUpdate) -> Preset:
    schema_fields_data = preset.schema_fields
    update_data = preset.model_dump(exclude={"schema_fields"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_preset, key, value)
    db_preset.updated_at = datetime.utcnow()
    session.add(db_preset)

    if schema_fields_data is not None:
        for field in list(db_preset.schema_fields):
            session.delete(field)
        for field_data in schema_fields_data:
            db_field = SchemaField(preset_id=db_preset.id, **field_data.model_dump())
            session.add(db_field)

    session.commit()
    session.refresh(db_preset)
    return db_preset


def delete_preset(session: Session, db_preset: Preset) -> None:
    # Delete associated runs first to avoid foreign key constraints
    runs = session.exec(select(Run).where(Run.preset_id == db_preset.id)).all()
    for run in runs:
        session.delete(run)
    
    session.delete(db_preset)
    session.commit()


def duplicate_preset(session: Session, db_preset: Preset) -> Preset:
    preset_data = db_preset.model_dump(exclude={"id", "schema_fields", "created_at", "updated_at"})
    preset_data["name"] = f"{db_preset.name} (Copy)"
    new_preset = Preset(**preset_data)
    session.add(new_preset)
    session.commit()
    session.refresh(new_preset)

    for field in db_preset.schema_fields:
        field_data = field.model_dump(exclude={"id", "preset_id"})
        new_field = SchemaField(preset_id=new_preset.id, **field_data)
        session.add(new_field)
    session.commit()
    session.refresh(new_preset)
    return new_preset


# Run CRUD

def get_runs(session: Session) -> List[Run]:
    statement = (
        select(Run)
        .options(
            selectinload(Run.preset).selectinload(Preset.schema_fields),
        )
        .order_by(Run.created_at.desc())
    )
    return list(session.exec(statement).all())


def get_run(session: Session, run_id: int) -> Optional[Run]:
    statement = (
        select(Run)
        .where(Run.id == run_id)
        .options(
            selectinload(Run.preset).selectinload(Preset.schema_fields),
        )
    )
    return session.exec(statement).first()


def create_run(session: Session, run: Run) -> Run:
    session.add(run)
    session.commit()
    session.refresh(run)
    return run


def delete_run(session: Session, db_run: Run) -> None:
    session.delete(db_run)
    session.commit()
