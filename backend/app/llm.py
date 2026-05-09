import json
import time
import os
import re
from typing import List, Optional
from openai import OpenAI
from pydantic import BaseModel

from app.models import SchemaField, Preset, Provider


class _GeneratedSchemaField(BaseModel):
    name: str
    type: str
    required: bool = True
    description: str = ""
    enum_values: Optional[str] = None
    validation_hint: Optional[str] = None
    example: Optional[str] = None
    default_value: Optional[str] = None
    properties: Optional[str] = None


class _GeneratedPreset(BaseModel):
    name: str
    description: str
    tags: str
    system_prompt: str
    user_prompt_template: str
    model: Optional[str] = None
    schema_fields: List[_GeneratedSchemaField]


def _build_field_schema(
    type_: str,
    description: Optional[str] = None,
    enum_values: Optional[str] = None,
    validation_hint: Optional[str] = None,
    example: Optional[str] = None,
    default_value: Optional[str] = None,
    properties: Optional[str] = None,
    required: bool = True,
) -> dict:
    if type_ == "string":
        schema: dict = {"type": "string"}
    elif type_ == "number":
        schema = {"type": "number"}
    elif type_ == "integer":
        schema = {"type": "integer"}
    elif type_ == "boolean":
        schema = {"type": "boolean"}
    elif type_ == "enum":
        values = [v.strip() for v in enum_values.split(",")] if enum_values else []
        schema = {"type": "string", "enum": values}
    elif type_ == "list[string]":
        schema = {"type": "array", "items": {"type": "string"}}
    elif type_ == "list[number]":
        schema = {"type": "array", "items": {"type": "number"}}
    elif type_ == "object":
        schema = {"type": "object", "additionalProperties": False}
        _add_nested_properties(schema, properties)
    elif type_ == "list[object]":
        schema = {"type": "array", "items": {"type": "object", "additionalProperties": False}}
        _add_nested_properties(schema["items"], properties)
    else:
        schema = {"type": "string"}

    desc_parts = []
    if description:
        desc_parts.append(description)
    if validation_hint:
        desc_parts.append(f"Hint: {validation_hint}")
    if default_value:
        desc_parts.append(f"Default: {default_value}")
    if desc_parts:
        schema["description"] = " | ".join(desc_parts)
    if example:
        try:
            schema["example"] = json.loads(example)
        except (json.JSONDecodeError, TypeError):
            schema["example"] = example

    return schema


def _add_nested_properties(target: dict, properties: Optional[str]) -> None:
    if not properties:
        return
    try:
        nested = json.loads(properties)
    except (json.JSONDecodeError, TypeError):
        return

    props = {}
    req = []
    for item in nested:
        props[item["name"]] = _build_field_schema(
            type_=item.get("type", "string"),
            description=item.get("description"),
            enum_values=item.get("enum_values"),
            validation_hint=item.get("validation_hint"),
            example=item.get("example"),
            default_value=item.get("default_value"),
            properties=item.get("properties"),
            required=item.get("required", True),
        )
        if item.get("required"):
            req.append(item["name"])

    if props:
        target["properties"] = props
    if req:
        target["required"] = req


def build_json_schema(fields: List[SchemaField]) -> dict:
    properties: dict = {}
    required: List[str] = []
    for field in fields:
        properties[field.name] = _build_field_schema(
            type_=field.type,
            description=field.description,
            enum_values=field.enum_values,
            validation_hint=field.validation_hint,
            example=field.example,
            default_value=field.default_value,
            properties=field.properties,
            required=field.required,
        )
        if field.required:
            required.append(field.name)

    schema: dict = {"type": "object", "properties": properties, "additionalProperties": False}
    if required:
        schema["required"] = required
    return schema


def render_prompt(template: str, input_text: str) -> str:
    result = template.replace("{{input}}", input_text)
    result = result.replace("{input}", input_text)
    return result


def validate_output(output: dict, fields: List[SchemaField]) -> List[str]:
    errors: List[str] = []
    for field in fields:
        if field.required and field.name not in output:
            errors.append(f"Required field '{field.name}' is missing")
    return errors


def generate_preset_draft(provider: Provider, prompt: str) -> dict:
    api_key = provider.api_key or os.environ.get("OPENAI_API_KEY", "")
    client = OpenAI(base_url=provider.base_url, api_key=api_key)
    model = provider.default_model or ""

    schema = _GeneratedPreset.model_json_schema()
    schema["additionalProperties"] = False
    schema_json = json.dumps(schema, indent=2)

    system_prompt = (
        "You are an expert prompt engineer. Your task is to create a complete AI preset "
        "based on the user's description. A preset consists of: name, description, tags, "
        "system prompt, user prompt template (must include {{input}}), optional model, "
        "and a list of schema fields that define the structured JSON output.\n\n"
        "Rules:\n"
        "- The user_prompt_template MUST reference user input using {{input}}.\n"
        "- schema_fields define the output JSON structure. Choose appropriate types.\n"
        "- Supported field types: string, number, integer, boolean, enum, list[string], list[number], object, list[object].\n"
        "- For object and list[object] fields, provide nested field definitions in the properties field as a JSON array string.\n"
        "- The properties field follows the same shape as schema_fields and can be nested arbitrarily deep.\n"
        "- For enum fields, provide comma-separated values in enum_values.\n"
        "- Make the preset practical and immediately usable.\n\n"
        "Respond with a valid JSON object matching this schema:\n"
        f"{schema_json}\n"
        "Do not include any other text, only the JSON object."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Create a preset for: {prompt}"},
    ]

    kwargs: dict = {"model": model, "messages": messages}

    try:
        response = client.chat.completions.create(
            **kwargs,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "generated_preset",
                    "strict": True,
                    "schema": schema,
                },
            },
        )
    except Exception:
        response = client.chat.completions.create(**kwargs)

    raw_content = response.choices[0].message.content or "{}"

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        match = re.search(r"```(?:json)?\s*(.*?)```", raw_content, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                raise ValueError(f"Failed to parse JSON response: {raw_content[:500]}")
        else:
            raise ValueError(f"Failed to parse JSON response: {raw_content[:500]}")

    # Validate against our model
    validated = _GeneratedPreset.model_validate(parsed)
    return validated.model_dump()


def call_llm(
    provider: Provider,
    preset: Preset,
    input_text: str,
    schema_fields: List[SchemaField],
    overrides: Optional[dict] = None,
    images: Optional[List[str]] = None,
) -> dict:
    overrides = overrides or {}

    api_key = provider.api_key or os.environ.get("OPENAI_API_KEY", "")
    client = OpenAI(
        base_url=provider.base_url,
        api_key=api_key,
    )

    model = overrides.get("model", provider.default_model)

    user_prompt_template = overrides.get("user_prompt_template", preset.user_prompt_template)
    user_prompt = render_prompt(user_prompt_template, input_text)

    schema = build_json_schema(schema_fields)
    schema_json = json.dumps(schema, indent=2)

    system_prompt = overrides.get("system_prompt", preset.system_prompt) or ""
    system_prompt += (
        f"\n\nYou must respond with a valid JSON object matching this schema:\n"
        f"{schema_json}\n"
        f"Do not include any other text, only the JSON object."
    )

    if images:
        content: List[dict] = [{"type": "text", "text": user_prompt}]
        for img_url in images:
            content.append({"type": "image_url", "image_url": {"url": img_url}})
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content},
        ]
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    kwargs: dict = {
        "model": model,
        "messages": messages,
    }

    if preset.frequency_penalty is not None:
        kwargs["frequency_penalty"] = preset.frequency_penalty
    if preset.presence_penalty is not None:
        kwargs["presence_penalty"] = preset.presence_penalty
    if preset.temperature is not None:
        kwargs["temperature"] = preset.temperature
    if preset.max_completion_tokens is not None:
        kwargs["max_completion_tokens"] = preset.max_completion_tokens
    if preset.top_p is not None:
        kwargs["top_p"] = preset.top_p
    if preset.reasoning_effort is not None:
        kwargs["reasoning_effort"] = preset.reasoning_effort

    if "temperature" in overrides:
        kwargs["temperature"] = overrides["temperature"]
    if "max_completion_tokens" in overrides:
        kwargs["max_completion_tokens"] = overrides["max_completion_tokens"]
    if "top_p" in overrides:
        kwargs["top_p"] = overrides["top_p"]
    if "frequency_penalty" in overrides:
        kwargs["frequency_penalty"] = overrides["frequency_penalty"]
    if "presence_penalty" in overrides:
        kwargs["presence_penalty"] = overrides["presence_penalty"]
    if "reasoning_effort" in overrides:
        kwargs["reasoning_effort"] = overrides["reasoning_effort"]

    start_time = time.time()

    try:
        response = client.chat.completions.create(
            **kwargs,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "preset_output",
                    "strict": True,
                    "schema": schema,
                },
            },
        )
    except Exception:
        response = client.chat.completions.create(**kwargs)

    duration_ms = int((time.time() - start_time) * 1000)
    raw_content = response.choices[0].message.content or "{}"

    # Try to parse JSON
    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        match = re.search(r"```(?:json)?\s*(.*?)```", raw_content, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                raise ValueError(
                    f"Failed to parse JSON response: {raw_content[:500]}"
                )
        else:
            raise ValueError(f"Failed to parse JSON response: {raw_content[:500]}")

    # Validate
    errors = validate_output(parsed, schema_fields)
    if errors:
        raise ValueError(f"Validation failed: {'; '.join(errors)}")

    return {
        "output": json.dumps(parsed),
        "raw_response": raw_content,
        "duration_ms": duration_ms,
        "tokens_prompt": response.usage.prompt_tokens if response.usage else None,
        "tokens_completion": (
            response.usage.completion_tokens if response.usage else None
        ),
    }
