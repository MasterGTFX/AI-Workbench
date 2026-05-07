Use this as the initial coding-agent prompt, with the UI mockup image attached.

```text
Build a local-first web app called “AI Workbench”.

Goal:
Create a clean, simple personal web app for defining, saving, testing, and running reusable AI structured-output presets. The app should look like the attached clean light UI mockup: left sidebar, presets list, editor tabs, schema builder, run screen, history, and provider settings.

Tech stack:
Backend:
- Python
- FastAPI
- SQLite
- SQLAlchemy or SQLModel
- Pydantic
- OpenAI Python SDK
- Support OpenAI-compatible APIs via custom base_url
- Simple local development setup

Frontend:
- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Clean light theme
- No unnecessary complexity
- Easy to modify

Do not use Next.js unless absolutely necessary.

Core concept:
A “Preset” is a reusable AI workflow containing:
- name
- description
- provider configuration
- model
- system prompt
- user prompt template
- output schema fields
- model parameters
- run history

Main app layout:
1. Left sidebar
   - App name: AI Workbench
   - New Preset button
   - Presets
   - History
   - Settings
   - Active provider card

2. Presets dashboard
   - Search presets
   - Filter by tag
   - Sort by updated date
   - Table/list with:
     - name
     - description
     - tags
     - model
     - updated date
     - actions: run, edit, duplicate, delete

3. Create/Edit Preset screen
   Tabs:
   - Configure
   - Schema
   - Run
   - History

Configure tab:
- Preset name
- Description
- Provider
- Base URL
- Model
- Temperature
- Max tokens
- Top P
- Frequency penalty
- Presence penalty
- Stream response checkbox
- System prompt textarea
- User prompt template textarea
- Quick test input area
- Save Preset button

Schema tab:
Allow building a structured output schema visually.

Supported field types:
- string
- number
- integer
- boolean
- enum
- list[string]
- list[number]
- object
- list[object]

Each field should have:
- field name
- type
- required boolean
- description
- enum values if enum
- validation hint / rule as text
- example value
- default value optional

Show:
- field list on the left
- selected field details in the middle
- generated JSON Schema preview on the right

Run tab:
- Large input textarea
- Optional file upload / attachment field
- Run button
- Result view
- Raw JSON view
- Validation status
- Copy JSON
- Copy Markdown
- Download JSON
- Download Markdown
- Show run metadata:
  - model
  - duration
  - prompt tokens
  - completion tokens
  - created at

History tab:
- List previous runs for that preset
- Status
- date
- model
- duration
- tokens
- View result

Global History screen:
- Search runs
- Filter by preset
- Filter by status
- Table of all runs
- Click to open run details

Run Details screen:
- Overview metadata
- Input tab
- Result tab
- Raw JSON tab
- Logs/errors tab
- Attachments
- Actions:
  - copy input
  - copy result
  - download all
  - run again
  - delete run

Settings screen:
Tabs:
- Providers
- General
- API Keys
- Templates
- Import / Export

Providers:
- Add provider
- Edit provider
- Delete provider
- Fields:
  - name
  - base_url
  - default_model
  - api_key_env_var or saved API key reference
  - active boolean

Default providers:
- OpenAI: https://api.openai.com/v1
- OpenRouter: https://openrouter.ai/api/v1
- Local Llama: http://localhost:11434/v1 or configurable

Data models:
Provider:
- id
- name
- base_url
- default_model
- api_key_ref
- is_active
- created_at
- updated_at

Preset:
- id
- name
- description
- tags
- provider_id
- model
- system_prompt
- user_prompt_template
- parameters JSON
- schema JSON
- created_at
- updated_at

SchemaField:
Can either be stored as part of Preset.schema JSON or normalized. Prefer simple JSON storage first.

Run:
- id
- preset_id
- provider_id
- input_text
- rendered_prompt
- output_json
- output_markdown optional
- raw_response JSON
- status: success/error
- error_message
- duration_ms
- prompt_tokens
- completion_tokens
- total_tokens
- model
- created_at

API endpoints:
Providers:
- GET /api/providers
- POST /api/providers
- GET /api/providers/{id}
- PUT /api/providers/{id}
- DELETE /api/providers/{id}

Presets:
- GET /api/presets
- POST /api/presets
- GET /api/presets/{id}
- PUT /api/presets/{id}
- DELETE /api/presets/{id}
- POST /api/presets/{id}/duplicate

Runs:
- GET /api/runs
- GET /api/runs/{id}
- GET /api/presets/{id}/runs
- POST /api/presets/{id}/run
- DELETE /api/runs/{id}

Schema:
- POST /api/schema/preview
- POST /api/schema/validate-output

LLM behavior:
When running a preset:
1. Load preset and provider.
2. Render user prompt template using input text.
   Example variable:
   {{input}}
3. Build JSON Schema from schema fields.
4. Call OpenAI-compatible API using OpenAI SDK.
5. Request structured JSON output.
6. Validate output against generated Pydantic model or JSON Schema.
7. Save run result.
8. Return structured result and metadata.

Use OpenAI SDK with configurable base_url:
- api_key from environment variable or provider config
- base_url from provider
- model from preset

For structured output:
- Prefer JSON Schema response format where supported.
- Also include fallback mode:
  - ask model to return valid JSON only
  - parse JSON
  - validate locally

Initial seed data:
Create example presets:
1. Bug Report Generator
   Fields:
   - title: string, required
   - severity: enum low/medium/high/critical, required
   - reproduction_steps: list[string], required
   - expected_result: string, required
   - actual_result: string, required
   - possible_cause: string, optional
   - suggested_fix: string, optional

2. Business Email Generator
   Fields:
   - subject: string
   - body: string
   - tone: enum casual/professional/direct
   - call_to_action: string

3. Feature Spec Generator
   Fields:
   - feature_name: string
   - problem: string
   - proposed_solution: string
   - user_stories: list[string]
   - acceptance_criteria: list[string]
   - risks: list[string]

Design requirements:
- Match the attached light UI mockup style.
- Minimal, modern, lots of whitespace.
- Blue accent color.
- Rounded cards.
- Clear tables.
- Simple icons.
- Everything should be visible and understandable.
- Avoid overengineering.
- No authentication for now.
- Local-first.
- Keep code clean and readable.
- Use clear folder structure.
- Add comments only where helpful.

Suggested project structure:

ai-workbench/
  backend/
    app/
      main.py
      database.py
      models.py
      schemas.py
      crud.py
      llm.py
      routers/
        presets.py
        providers.py
        runs.py
        schema.py
      seed.py
    requirements.txt
    .env.example
  frontend/
    src/
      api/
      components/
      pages/
      routes/
      types/
      utils/
      App.tsx
      main.tsx
    package.json
  README.md

README should include:
- What the app does
- How to run backend
- How to run frontend
- How to configure API keys
- Example provider configs
- How to create a preset
- How to run a preset

Development priorities:
Phase 1:
- Backend CRUD
- SQLite database
- Providers
- Presets
- Schema builder data format
- Run preset endpoint
- Basic frontend views

Phase 2:
- Better schema builder UX
- Run history
- JSON/Markdown copy/export
- Import/export presets

Phase 3:
- Streaming
- File attachments
- Preset versioning
- Batch runs
- More provider integrations

Important:
Start with a working backbone, not a perfect product.
Favor simple implementation over abstract architecture.
Use Pythonic backend code.
Use typed frontend code.
Make it easy to modify later.
```
