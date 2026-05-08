import json
import time
import os
import re
from typing import List, Optional
from openai import OpenAI

from app.models import SchemaField, Preset, Provider


def build_json_schema(fields: List[SchemaField]) -> dict:
    properties: dict = {}
    required: List[str] = []
    for field in fields:
        field_type = field.type
        if field_type == "string":
            json_type: dict = {"type": "string"}
        elif field_type == "number":
            json_type = {"type": "number"}
        elif field_type == "integer":
            json_type = {"type": "integer"}
        elif field_type == "boolean":
            json_type = {"type": "boolean"}
        elif field_type == "enum":
            values = (
                [v.strip() for v in field.enum_values.split(",")]
                if field.enum_values
                else []
            )
            json_type = {"type": "string", "enum": values}
        elif field_type == "list[string]":
            json_type = {"type": "array", "items": {"type": "string"}}
        elif field_type == "list[number]":
            json_type = {"type": "array", "items": {"type": "number"}}
        elif field_type == "object":
            json_type = {"type": "object"}
        elif field_type == "list[object]":
            json_type = {"type": "array", "items": {"type": "object"}}
        else:
            json_type = {"type": "string"}

        if field.description:
            json_type["description"] = field.description
        if field.example:
            try:
                json_type["example"] = json.loads(field.example)
            except (json.JSONDecodeError, TypeError):
                json_type["example"] = field.example

        properties[field.name] = json_type
        if field.required:
            required.append(field.name)

    schema: dict = {"type": "object", "properties": properties}
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


def call_llm(
    provider: Provider,
    preset: Preset,
    input_text: str,
    schema_fields: List[SchemaField],
    overrides: Optional[dict] = None,
) -> dict:
    overrides = overrides or {}

    api_key = provider.api_key or os.environ.get("OPENAI_API_KEY", "")
    client = OpenAI(
        base_url=provider.base_url,
        api_key=api_key,
    )

    model = overrides.get("model", preset.model or provider.default_model)

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
    if preset.max_tokens is not None:
        kwargs["max_tokens"] = preset.max_tokens
    if preset.top_p is not None:
        kwargs["top_p"] = preset.top_p

    if "temperature" in overrides:
        kwargs["temperature"] = overrides["temperature"]
    if "max_tokens" in overrides:
        kwargs["max_tokens"] = overrides["max_tokens"]
    if "top_p" in overrides:
        kwargs["top_p"] = overrides["top_p"]

    start_time = time.time()

    try:
        response = client.chat.completions.create(
            **kwargs,
            response_format={"type": "json_object"},
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
