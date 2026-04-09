# Project Guidelines – FastAPI API

## Project Overview
This is a Python-based REST API project built with FastAPI. Use this file to guide AI agents working in this repository.

---

## Tech Stack
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy / SQLModel
- **Testing:** pytest, httpx
- **Package Manager:** pip / Poetry

---

## Project Structure
```
app/
  api/
    v1/
      endpoints/     # Route handlers grouped by resource
  core/              # Config, settings, security
  db/                # Database engine, session, base model
  models/            # SQLAlchemy models
  schemas/           # Pydantic schemas (request/response)
  services/          # Business logic
  main.py            # App entry point
tests/
  unit/
  integration/
appconfig.py           # Centralized environment variable access
.env
requirements.txt / pyproject.toml
```

---

## Coding Guidelines
- Use `snake_case` for variables, functions, and file names.
- Use Pydantic models for all request and response schemas.
- Keep route handlers thin; move logic to service modules.
- Use dependency injection (`Depends`) for DB sessions and auth.
- All endpoints must have proper response models and status codes.
- **All environment variables MUST be read exclusively through `appconfig.py`. Never call `os.getenv()`, `os.environ`, or `dotenv` directly in any other module.**

### `appconfig.py` — Environment Variable Encapsulation

All environment variables are centralized in `appconfig.py` at the project root:

```python
import os

OPEN_API_KEY: str = os.getenv("OPEN_API_KEY", "")
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./dev.db")
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
```

- One variable per line, typed.
- Provide safe defaults where applicable; use `""` for secrets.
- Import from `appconfig` everywhere else — never bypass it.

---

## Running the Project
```bash
uvicorn app.main:app --reload
```

## Running Tests
```bash
pytest
```

---

## Notes for AI Agents
- Do not commit `.env` files; use `.env.example` as reference.
- Always add or update tests when adding new endpoints or services.
- Run `ruff check .` and `black .` before finalizing changes.
