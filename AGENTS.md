# AGENTS.md

## Project overview

OpoTest: FastAPI backend + React (Vite) frontend. AI-powered exam simulator for Spanish civil-service exams (oposiciones). PostgreSQL database. AGPL-3.0 license.

## Architecture

- `/backend` — FastAPI + SQLAlchemy + psycopg2. Python 3.10+.
- `/frontend` — React 19 + Vite 8. oxlint (not ESLint). Vanilla CSS.
- DB tables are auto-created on backend startup via `Base.metadata.create_all` — no migration tool.
- Domain models and API responses use Spanish names: `Tema`, `Pregunta`, `Examen`, `RespuestaExamen`.

## Startup (required order)

```bash
# 1. Database (PostgreSQL in Docker, port 5435 — not 5432)
docker compose up -d

# 2. Backend (from backend/)
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # review DATABASE_URL and AGY_BIN
uvicorn app.main:app --reload --port 8001

# 3. Frontend (from frontend/)
cd frontend && npm install && npm run dev
# Opens on http://localhost:5173; proxies /api to localhost:8001
```

## Lint / Format

```bash
# Frontend only (oxlint, configured in frontend/.oxlintrc.json)
cd frontend && npm run lint
```

No backend linter, formatter, or typecheck configured. No test suite exists.

## Key gotchas

- **DB port is 5435**, mapped from container's 5432. Update `DATABASE_URL` in `backend/.env` if you change this.
- **Backend reads `.env` from `backend/.env`** (hardcoded path in `database.py`), not from CWD.
- **AI question generation** calls the `agy` (Antigravity CLI) binary as a subprocess — not the `google-generativeai` Python SDK. The binary path resolves via `AGY_BIN` env var, then `PATH`, then `~/.local/bin/agy`. Generation times out after 600s.
- **Vite dev proxy**: `/api` requests are forwarded to `http://127.0.0.1:8001`. Production uses Apache as reverse proxy with the same convention.
- **PDF upload limit**: Apache config sets `LimitRequestBody` to 50 MB.
- **Frontend port**: 5173. Backend port: 8001.
