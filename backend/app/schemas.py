from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class SchemaFieldBase(BaseModel):
    name: str
    type: str
    required: bool = True
    description: Optional[str] = None
    enum_values: Optional[str] = None
    validation_hint: Optional[str] = None
    example: Optional[str] = None
    default_value: Optional[str] = None
    order: int = 0


class SchemaFieldCreate(SchemaFieldBase):
    pass


class SchemaFieldResponse(SchemaFieldBase):
    id: int
    preset_id: int

    class Config:
        from_attributes = True


class ModelItem(BaseModel):
    id: str


class ProviderBase(BaseModel):
    name: str
    base_url: str
    api_key: Optional[str] = None
    default_model: Optional[str] = None
    active: bool = True


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    default_model: Optional[str] = None
    active: Optional[bool] = None


class ProviderResponse(ProviderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PresetBase(BaseModel):
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


class PresetCreate(PresetBase):
    schema_fields: List[SchemaFieldCreate] = []


class PresetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    temperature: Optional[float] = None
    max_completion_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    reasoning_effort: Optional[str] = None
    stream: Optional[bool] = None
    schema_fields: Optional[List[SchemaFieldCreate]] = None


class PresetResponse(PresetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    schema_fields: List[SchemaFieldResponse] = []

    class Config:
        from_attributes = True


class RunBase(BaseModel):
    preset_id: int
    input: str
    output: Optional[str] = None
    raw_response: Optional[str] = None
    status: str
    model: str
    duration_ms: Optional[int] = None
    tokens_prompt: Optional[int] = None
    tokens_completion: Optional[int] = None
    error: Optional[str] = None


class RunResponse(RunBase):
    id: int
    created_at: datetime
    preset: Optional[PresetResponse] = None

    class Config:
        from_attributes = True


class RunOverrides(BaseModel):
    temperature: Optional[float] = None
    max_completion_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    reasoning_effort: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None


class PresetGenerateRequest(BaseModel):
    prompt: str
    provider_id: Optional[int] = None


class PresetGenerateResponse(BaseModel):
    name: str
    description: Optional[str] = None
    tags: str = ""
    system_prompt: Optional[str] = None
    user_prompt_template: str
    schema_fields: List[SchemaFieldCreate] = []


class RunExecuteRequest(BaseModel):
    input: str
    overrides: Optional[RunOverrides] = None
