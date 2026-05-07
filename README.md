# AI Workbench

AI Workbench is a local-first web application for creating, managing, and running reusable AI presets with structured outputs.

It provides a clean interface for:
- defining prompts
- configuring models/providers
- building output schemas visually
- validating structured AI responses
- saving run history
- testing prompts quickly

The goal is to make repetitive AI workflows reusable, predictable, and easy to iterate on.

---

# Features

## Presets

Create reusable AI workflows containing:
- provider configuration
- model selection
- system prompt
- user prompt template
- structured output schema
- model parameters

Example presets:
- Bug Report Generator
- Business Email Generator
- Feature Spec Generator
- Ticket Classifier
- Database Mapping Generator

---

## Structured Output Schema Builder

Visually define output fields with:
- field name
- type
- required flag
- descriptions
- enum values
- validation hints
- example values

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

Generated schemas can be validated automatically against AI responses.

---

## Multi-Provider Support

Supports OpenAI-compatible APIs using configurable base URLs.

Examples:
- OpenAI
- OpenRouter
- Local llama.cpp / Ollama
- LM Studio
- Custom OpenAI-compatible endpoints

Each provider can define:
- base URL
- default model
- API key reference
- active status

---

## Run & Validate

Run presets against:
- logs
- text input
- pasted content
- uploaded files (planned)

Features:
- structured JSON output
- validation status
- raw JSON view
- copy/export JSON
- copy/export Markdown
- token usage
- duration metrics
- run history

---

# Screens

## Main Areas

### Dashboard
- list presets
- search/filter/sort
- quick actions

### Configure
- provider
- model
- prompts
- model parameters

### Schema Builder
- visual schema editor
- JSON Schema preview

### Run
- execute preset
- inspect results
- validate output

### History
- previous runs
- run details
- logs/errors

### Settings
- providers
- API keys
- import/export

---

# Tech Stack

## Backend
- Python
- FastAPI
- SQLite
- SQLAlchemy / SQLModel
- Pydantic
- OpenAI Python SDK

## Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

---

# Project Structure

```text
ai-workbench/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   ├── llm.py
│   │   └── seed.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
└── README.md
```

---

# Local Development

## Backend

### Install

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment

Create `.env`:

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=sqlite:///./app.db
```

### Run Backend

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```text
http://localhost:8000
```

---

## Frontend

### Install

```bash
cd frontend

npm install
```

### Run Frontend

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

# Example Provider Configurations

## OpenAI

```text
Base URL:
https://api.openai.com/v1
```

## OpenRouter

```text
Base URL:
https://openrouter.ai/api/v1
```

## Ollama

```text
Base URL:
http://localhost:11434/v1
```

---

# Example Workflow

## 1. Create Preset

Example:
- Bug Report Generator

Define:
- prompts
- model
- schema fields

---

## 2. Add Schema

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

---

## 3. Run Preset

Paste:
- logs
- stack traces
- requirements
- notes

AI Workbench:
- renders prompt
- calls model
- validates output
- saves run history

---

# API Overview

## Providers

```http
GET    /api/providers
POST   /api/providers
PUT    /api/providers/{id}
DELETE /api/providers/{id}
```

## Presets

```http
GET    /api/presets
POST   /api/presets
GET    /api/presets/{id}
PUT    /api/presets/{id}
DELETE /api/presets/{id}
POST   /api/presets/{id}/duplicate
```

## Runs

```http
GET    /api/runs
GET    /api/runs/{id}
POST   /api/presets/{id}/run
DELETE /api/runs/{id}
```

---

# Roadmap

## Phase 1
- preset CRUD
- providers
- schema builder
- run execution
- run history
- structured validation

## Phase 2
- markdown export
- import/export presets
- attachments
- streaming responses

## Phase 3
- preset versioning
- batch runs
- prompt templates
- local model optimizations
- workflow chaining

---

# Design Philosophy

AI Workbench is intentionally:
- local-first
- simple
- fast to iterate on
- easy to modify
- schema-oriented
- provider-agnostic

The focus is practical AI workflows, not building a large SaaS platform.

---

# License

MIT
