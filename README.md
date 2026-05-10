# AI Workbench

AI Workbench is a local-first web application for creating, managing, and running reusable AI presets with structured outputs.

It provides a clean interface for:
- Defining prompts
- Configuring models/providers
- Building output schemas visually
- Validating structured AI responses
- Saving run history
- Testing prompts quickly
- Generating presets with AI
- **Dark Mode Support** (Light, Dark, and System preference)

The goal is to make repetitive AI workflows reusable, predictable, and easy to iterate on.

---

## Features

### Presets

Create reusable AI workflows containing:
- Provider configuration
- Model selection
- System prompt
- User prompt template
- Structured output schema
- Optional model parameters (temperature, max completion tokens, top_p, frequency penalty, presence penalty, reasoning effort, stream)

Example presets included out of the box:
- Bug Report Generator
- Business Email Generator
- Feature Spec Generator
- DB Import Mapper
- Support Ticket Classifier

### AI Preset Generation

Describe what you want in plain language and the app generates a complete preset draft:
- Name, description, and tags
- System and user prompts (with `{{input}}` placeholder)
- Structured output schema with appropriate field types

### Import / Export

Export all your presets as a JSON file and import them back to any instance. The system automatically de-duplicates presets by name and is backward compatible, gracefully handling missing optional parameters or extra fields.

### Structured Output Schema Builder

Visually define output fields with:
- Field name
- Type (`string`, `number`, `integer`, `boolean`, `enum`, `list[string]`, `list[number]`, `object`, `list[object]`)
- Nested properties for objects
- Required flag
- Description
- Enum values (comma-separated)
- Validation hints
- Example values
- Default values
- Display order

Generated schemas are automatically validated against AI responses.

### Multi-Provider Support

Supports OpenAI-compatible APIs using configurable base URLs.

Pre-configured providers:
- OpenAI (`https://api.openai.com/v1`)
- OpenRouter (`https://openrouter.ai/api/v1`)
- Local Llama / Ollama (`http://localhost:11434/v1`)

Each provider can define:
- Base URL
- Default model
- API key
- Active status

The sidebar shows the active provider and opens a model-picker dialog that fetches available models from the provider's API.

### Run & Validate

Run presets against text input and get:
- Structured JSON output
- Validation status
- Raw JSON view
- Per-field result cards with copy buttons
- Markdown rendering for string fields
- Rich HTML copy (preserves bold, italic, lists when pasting)
- Copy/export JSON
- Copy/export Markdown
- Token usage
- Duration metrics
- Run history

**Run Overrides** — Override at execution time:
- Model
- System prompt
- User prompt template
- Temperature, max completion tokens, top_p, frequency penalty, presence penalty, reasoning effort

---

## Screens

### Dashboard
- List presets
- Search/filter/sort
- Quick actions (run, edit, duplicate, delete)
- Table and card views
- Pagination

### Preset Editor

**Configure Tab**
- Provider & model selection (inherited from active provider)
- System & user prompts
- Model parameters (all optional)
- AI generation panel for new presets

**Schema Tab**
- Visual schema editor
- Field type selection (including enum and nested objects)
- JSON Schema preview

**Run Tab**
- Input editor
- Run settings overrides
- Results with JSON/Markdown export
- Validation status
- Run metrics
- Markdown rendering for string values

**History Tab**
- Previous runs for the preset
- Run details dialog
- Run again with pre-filled input

### History
- All runs across presets
- Search/filter by preset, status
- Run details with markdown rendering
- Run again

### Settings
- Provider management (add/edit/delete)
- API key configuration
- Active provider toggle

---

## Tech Stack

### Backend
- Python 3.12+
- FastAPI
- SQLite
- SQLModel (SQLAlchemy + Pydantic)
- OpenAI Python SDK

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-inspired components (custom built)
- Lucide React icons
- React Router DOM
- Axios
- React Hot Toast
- date-fns
- marked (markdown rendering)

---

## Project Structure

```text
ai-workbench/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── providers.py
│   │   │   ├── presets.py
│   │   │   └── runs.py
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   ├── llm.py
│   │   └── seed.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── SchemaNestedEditor.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PresetEditor.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── RunDetails.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── routes/
│   │   │   └── AppRoutes.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── helpers.ts
│   │   │   └── resultRenderers.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── scripts/
│   ├── logs.sh
│   ├── reset.sh
│   ├── restart.sh
│   └── stop.sh
│
└── README.md
```

---

## Docker Quick Start

Start the app:

```bash
docker compose up -d --build
```

Open:
- Frontend: `http://localhost`

Helper scripts:

```bash
./scripts/restart.sh   # git pull + rebuild + restart
./scripts/logs.sh      # follow docker compose logs
./scripts/stop.sh      # stop the stack
./scripts/reset.sh     # full reset, including volumes
```

Notes:
- The backend container has outbound internet access for remote providers.
- For OpenAI/OpenRouter model fetching, you must save a provider API key in Settings.
- For local Ollama from Docker, do not use `http://localhost:11434/v1`. Use `http://host.docker.internal:11434/v1` instead.

Typical update flow after pulling new repo changes:

```bash
./scripts/restart.sh
```

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- An OpenAI API key (or another OpenAI-compatible API key)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys
```

`.env` example:
```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=sqlite:///./app.db
```

```bash
# Run backend
uvicorn app.main:app --reload
```

Backend will run on: `http://localhost:8000`

API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

The frontend is pre-configured to proxy API requests to `http://localhost:8000`.

### Production Build

```bash
cd frontend
npm run build
```

Production build output goes to `frontend/dist/`.

---

## API Overview

### Providers
```http
GET    /api/providers/
POST   /api/providers/
GET    /api/providers/{id}/
PUT    /api/providers/{id}/
DELETE /api/providers/{id}/
POST   /api/providers/{id}/activate
GET    /api/providers/{id}/models
```

### Presets
```http
GET    /api/presets/
POST   /api/presets/
GET    /api/presets/{id}/
PUT    /api/presets/{id}/
DELETE /api/presets/{id}/
POST   /api/presets/{id}/duplicate/
POST   /api/presets/generate/
POST   /api/presets/{id}/run/
GET    /api/presets/export/
POST   /api/presets/import/
```

### Runs
```http
GET    /api/runs/
GET    /api/runs/{id}/
DELETE /api/runs/{id}/
```

### Health
```http
GET    /api/health
```

---

## Example Workflow

### 1. Create a Preset

Example: Bug Report Generator

Define:
- System prompt: "You are an expert at analyzing application logs..."
- User prompt template: "Analyze the following logs and create a bug report:\n\n{{input}}"
- Model: gpt-4o

Or use **AI Generation**: type "Create a preset that extracts structured bug reports from application logs" and let the app generate the preset.

### 2. Add a Schema

Example fields:
```json
{
  "title": "string",
  "severity": "enum",
  "reproduction_steps": "list[string]",
  "expected_result": "string",
  "actual_result": "string"
}
```

### 3. Run the Preset

Paste logs, stack traces, or notes into the input field and click **Run**. The app will:
- Render the prompt template
- Call the configured model via the active provider
- Validate the structured JSON output
- Save the run to history
- Render markdown in string fields for readable output

---

## Provider Configurations

### OpenAI
```text
Base URL: https://api.openai.com/v1
Model: gpt-4o
```

### OpenRouter
```text
Base URL: https://openrouter.ai/api/v1
Model: openai/gpt-4o
```

### Ollama / Local Llama
```text
Base URL: http://localhost:11434/v1
Model: llama3.1
```

---

## Design Philosophy

AI Workbench is intentionally:
- **Local-first** – your data stays on your machine
- **Simple** – minimal moving parts, easy to understand
- **Fast to iterate on** – change presets and re-run instantly
- **Easy to modify** – clean code, no magic
- **Schema-oriented** – structured outputs by default
- **Provider-agnostic** – works with any OpenAI-compatible API

The focus is practical AI workflows, not building a large SaaS platform.

---

## License

MIT
