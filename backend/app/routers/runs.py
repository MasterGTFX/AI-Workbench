from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app import crud, schemas

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("/", response_model=List[schemas.RunResponse])
def read_runs(session: Session = Depends(get_session)):
    return crud.get_runs(session)


@router.get("/{run_id}", response_model=schemas.RunResponse)
def read_run(run_id: int, session: Session = Depends(get_session)):
    db_run = crud.get_run(session, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")
    return db_run


@router.delete("/{run_id}")
def delete_run(run_id: int, session: Session = Depends(get_session)):
    db_run = crud.get_run(session, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")
    crud.delete_run(session, db_run)
    return {"ok": True}
