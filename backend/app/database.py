import os
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

sqlite_url = os.environ.get("DATABASE_URL", "sqlite:///./app.db")
connect_args = {"check_same_thread": False} if sqlite_url.startswith("sqlite") else {}
engine = create_engine(
    sqlite_url,
    connect_args=connect_args,
    poolclass=StaticPool,
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
