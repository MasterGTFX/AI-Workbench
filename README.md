# AI Workbench

AI Workbench is a local-first web application for creating, managing, and running reusable AI presets with structured outputs.

It provides a clean interface for:
- Defining prompts
- Configuring models/providers
- Building output schemas visually
- Validating structured AI responses
- Saving run history
- Testing prompts quickly

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
- Model parameters

Example presets included out of the box:
- Bug Report Generator
- Business Email Generator
- Feature Spec Generator
- DB Import Mapper
- Support Ticket Classifier

### Structured Output Schema Builder

Visually define output fields with:
- Field name
- Type (string, number, integer, boolean, enum, list[string], list[number], object, list[object])
- Required flag
- Description
- Enum values
- Validation hints
- Example values
- Default values

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

### Run & Validate

Run presets against text input and get:
- Structured JSON output
- Validation status
- Raw JSON view
- Copy/export JSON
- Copy/export Markdown
- Token usage
- Duration metrics
- Run history

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
- Provider & model selection
- System & user prompts
- Model parameters (temperature, max tokens, top_p, etc.)
- Quick test panel

**Schema Tab**
- Visual schema editor
- Field type selection
- JSON Schema preview

**Run Tab**
- Input editor
- Run settings overrides
- Results with JSON/Markdown export
- Validation status
- Run metrics

**History Tab**
- Previous runs for the preset
- Run details dialog

### History
- All runs across presets
- Search/filter by preset, status
- Run details

### Settings
- Provider management (add/edit/delete)
- API key configuration

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
- shadcn/ui-inspired components
- Lucide React icons
- React Router DOM
- Axios
- React Hot Toast

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
│   │   │   └── Sidebar.tsx
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
│   │   │   └── helpers.ts
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
└── README.md
```

---

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
PUT    /api/providers/{id}/
DELETE /api/providers/{id}/
```

### Presets
```http
GET    /api/presets/
POST   /api/presets/
GET    /api/presets/{id}/
PUT    /api/presets/{id}/
DELETE /api/presets/{id}/
POST   /api/presets/{id}/duplicate/
```

### Runs
```http
GET    /api/runs/
GET    /api/runs/{id}/
POST   /api/presets/{id}/run/
DELETE /api/runs/{id}/
```

---

## Example Workflow

### 1. Create a Preset

Example: Bug Report Generator

Define:
- System prompt: "You are an expert at analyzing application logs..."
- User prompt template: "Analyze the following logs and create a bug report:\n\n{{input}}"
- Model: gpt-4o

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
- Call the configured model
- Validate the structured JSON output
- Save the run to history

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
