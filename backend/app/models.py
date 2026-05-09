from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class Provider(SQLModel, table=True):
    __tablename__ = "provider"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    base_url: str
    api_key: Optional[str] = None
    default_model: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Preset(SQLModel, table=True):
    __tablename__ = "preset"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    tags: str = ""
    system_prompt: Optional[str] = None
    user_prompt_template: str
    temperature: Optional[float] = None
    max_completion_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    reasoning_effort: Optional[str] = None
    stream: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    schema_fields: List["SchemaField"] = Relationship(
        back_populates="preset",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class SchemaField(SQLModel, table=True):
    __tablename__ = "schema_field"
    id: Optional[int] = Field(default=None, primary_key=True)
    preset_id: int = Field(foreign_key="preset.id")
    name: str
    type: str
    required: bool = True
    description: Optional[str] = None
    enum_values: Optional[str] = None
    validation_hint: Optional[str] = None
    example: Optional[str] = None
    default_value: Optional[str] = None
    properties: Optional[str] = None
    order: int = 0

    preset: Optional[Preset] = Relationship(back_populates="schema_fields")


class Run(SQLModel, table=True):
    __tablename__ = "run"
    id: Optional[int] = Field(default=None, primary_key=True)
    preset_id: int = Field(foreign_key="preset.id")
    input: str
    output: Optional[str] = None
    raw_response: Optional[str] = None
    status: str = "pending"
    model: str
    duration_ms: Optional[int] = None
    tokens_prompt: Optional[int] = None
    tokens_completion: Optional[int] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    preset: Optional[Preset] = Relationship()
