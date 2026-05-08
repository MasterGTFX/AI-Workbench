# AI Workbench — Agent Guide

## Purpose

Local-first web app for creating, managing, and running reusable AI presets with structured outputs. Users define prompts, schemas, and model configs, then run them against text input to get validated JSON responses.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python, FastAPI, SQLModel, SQLite, OpenAI SDK |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Lucide React |

## Project Structure

```
backend/
  app/
    main.py          # FastAPI app, CORS, lifespan, routers
    database.py      # SQLite engine, SessionLocal
    models.py        # SQLModel tables: Provider, Preset, SchemaField, Run
    schemas.py       # Pydantic request/response models
    crud.py          # Database operations
    llm.py           # OpenAI client, schema building, prompt rendering, validation
    seed.py          # Demo data on first startup
    routers/
      providers.py   # /api/providers
      presets.py     # /api/presets
      runs.py        # /api/runs, /api/presets/{id}/run
frontend/
  src/
    api/client.ts    # Axios instance, auto-appends trailing slashes
    types/index.ts   # TypeScript types mirroring backend schemas
    utils/
      cn.ts          # clsx + tailwind-merge
      helpers.ts     # formatDate, formatDuration, tagColor, buildJsonSchema, download helpers
    components/
      ui/            # Reusable UI primitives (Button, Input, Dialog, Tabs, Select, etc.)
      Layout.tsx     # Sidebar + Outlet
      Sidebar.tsx    # Navigation, active provider card
    pages/
      Dashboard.tsx       # Presets list, search, filter, sort, pagination
      PresetEditor.tsx    # Configure / Schema / Run / History tabs
      HistoryPage.tsx     # Global runs list
      RunDetails.tsx      # Run detail drawer/dialog
      SettingsPage.tsx    # Provider management
    routes/AppRoutes.tsx
```

## Design Patterns

### Backend
- **SQLModel** for ORM + Pydantic validation in one model
- **Router-based** API organization (`routers/*.py`)
- **CRUD module** separates DB logic from HTTP handlers
- **LLM module** is pure logic: schema → JSON, template → prompt, output → validation
- **Seed on startup**: `lifespan` creates tables and seeds if DB is empty
- Trailing slashes on all API endpoints (axios interceptor handles this)

### Frontend
- **Custom UI primitives** (no shadcn CLI) built with Tailwind + Radix patterns
- **React Router** with layout route + Outlet
- **Local state** with hooks (no external state management)
- **Axios interceptors** for auth/API logic
- **URL-driven tabs**: `/presets/:id?tab=configure|schema|run|history`
- Toast notifications via `react-hot-toast`

## Conventions

- **Backend**: Use type hints everywhere. Return Pydantic response models from routers.
- **Frontend**: Use TypeScript strictly. Components are default exports. Props interfaces are inline.
- **Styling**: Tailwind utility classes. Colors use CSS variables from `index.css` (shadcn color system).
- **Icons**: Lucide React only.
- **API calls**: Always go through `apiClient` in `src/api/client.ts`.

## Common Commands

```bash
# Backend
cd backend && source ../venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000

# Frontend
cd frontend && npm install
npm run dev                             # http://localhost:5173
npm run build                           # outputs to dist/

# Reset database
rm backend/app.db
# Restart backend to re-seed
```

## Adding a Feature

1. **Backend first**: model → schema → crud → router → test with curl
2. **Frontend second**: type → api call → page/component → wire into router
3. **Seed data**: update `seed.py` if adding new demo presets/providers

## Important Notes

- The OpenAI client is initialized per-request with the provider's `base_url` and key.
- `response_format: {type: "json_object"}` is used when the API supports it.
- Schema fields support: `string`, `number`, `integer`, `boolean`, `enum`, `list[string]`, `list[number]`, `object`, `list[object]`.
- Frontend proxy in `vite.config.ts` forwards `/api` to `localhost:8000`.
