# Spec-0001 — FastAPI Initial Setup

## Goal
Bootstrap the project with a working FastAPI skeleton: entry point, settings, database session, health-check endpoint, linting, and tests.

---

## Scope
Only the foundational scaffolding. No domain logic, no auth, no migrations.

---

## Directory Structure to Create

```
app/
  api/
    v1/
      endpoints/
        health.py        # GET /health
      router.py          # Aggregates all v1 routers
  core/
    config.py            # Settings via pydantic-settings
  db/
    session.py           # SQLAlchemy async session factory
    base.py              # Declarative base
  main.py                # App factory + middleware + router inclusion
tests/
  unit/
    test_health.py
  integration/
    test_health_integration.py
.env.example
pyproject.toml           # deps + ruff + black + pytest config
```

---

## Files & Responsibilities

### `app/main.py`
- Create the `FastAPI` instance with `title`, `version`.
- Include `api/v1/router.py` with prefix `/api/v1`.
- Add a startup lifespan event (placeholder, no-op for now).

### `app/core/config.py`
- Single `Settings` class using `pydantic-settings`.
- Fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `APP_NAME` | `str` | `"chatmeai"` | App title |
| `DEBUG` | `bool` | `False` | Enable debug mode |
| `DATABASE_URL` | `str` | `"sqlite+aiosqlite:///./dev.db"` | DB connection |

- Export a `get_settings()` function (cached with `@lru_cache`).

### `app/db/base.py`
- Declare `Base = DeclarativeBase()`.

### `app/db/session.py`
- Create an async `AsyncEngine` from `settings.DATABASE_URL`.
- Factory function `get_session()` — async generator, used as `Depends`.

### `app/api/v1/endpoints/health.py`
- `GET /health` → `200 OK`
- Response model: `{"status": "ok", "version": "<APP_VERSION>"}`

### `app/api/v1/router.py`
- Single `APIRouter` that includes `health.router`.

### `.env.example`
```
APP_NAME=chatmeai
DEBUG=false
DATABASE_URL=sqlite+aiosqlite:///./dev.db
```

### `pyproject.toml`
Minimum required sections:

```toml
[tool.ruff]
line-length = 88
select = ["E", "F", "I"]

[tool.black]
line-length = 88

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn[standard]` | ASGI server |
| `pydantic-settings` | Typed settings from env |
| `sqlalchemy[asyncio]` | ORM + async engine |
| `aiosqlite` | Async SQLite driver (dev) |
| `pytest` | Test runner |
| `pytest-asyncio` | Async test support |
| `httpx` | Test HTTP client |
| `ruff` | Linter |
| `black` | Formatter |

---

## Tests

### Unit — `tests/unit/test_health.py`
- Mock `get_settings()` to control version.
- Assert response is `200` and body matches schema.

### Integration — `tests/integration/test_health_integration.py`
- Use `httpx.AsyncClient` with the real `app`.
- Assert `GET /api/v1/health` returns `{"status": "ok"}`.

---

## Acceptance Criteria

- [ ] `uvicorn app.main:app --reload` starts without errors.
- [ ] `GET /api/v1/health` returns `200 {"status": "ok", ...}`.
- [ ] `pytest` passes all tests.
- [ ] `ruff check .` exits clean.
- [ ] `black --check .` exits clean.
- [ ] `docker build .` succeeds.

---

## Out of Scope
- Authentication / JWT
- Alembic migrations
- Domain models or business logic
- CI/CD pipeline
