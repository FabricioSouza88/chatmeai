# Spec-0003 — Run Configuration

## Goal
Provide a consistent, reproducible way to run the FastAPI application in **development**, **production (Docker)**, and **VS Code** — including a `Makefile` for common tasks and an updated `Dockerfile` that works with `pyproject.toml` + `uv`.

---

## Scope
- `Makefile` with standard dev tasks.
- Updated `Dockerfile` (replace `requirements.txt` reference with `pyproject.toml` / `uv`).
- VS Code launch config (`launch.json`) and task config (`tasks.json`).
- No new application logic.

---

## Files to Create / Update

```
Makefile                        # Dev task runner (new)
Dockerfile                      # Updated to use uv + pyproject.toml
.vscode/
  launch.json                   # Run & Debug config for VS Code
  tasks.json                    # VS Code task definitions
```

---

## Files & Responsibilities

### `Makefile`

Targets:

| Target | Command | Description |
|---|---|---|
| `install` | `uv sync` | Install all deps (including dev) |
| `run` | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | Start dev server |
| `test` | `uv run pytest tests/ -v` | Run test suite |
| `lint` | `uv run ruff check .` | Lint check |
| `format` | `uv run black .` | Format code |
| `check` | `lint` + `format --check` | CI gate — lint & format only |
| `docker-build` | `docker build -t chatmeai .` | Build Docker image |
| `docker-run` | `docker run --env-file .env -p 8000:8000 chatmeai` | Run Docker container |

Rules:
- Mark all targets `.PHONY`.
- `check` must not modify files (use `black --check .`).

### `Dockerfile` (update)

Replace the current `requirements.txt`-based install with `uv`:

```dockerfile
# ── Build/dependency stage ─────────────────────────────────────────
FROM python:3.11-slim AS builder
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-editable

# ── Runtime stage ──────────────────────────────────────────────────
FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

COPY --from=builder /app/.venv /app/.venv

RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup appuser
USER appuser

COPY app/ ./app/
COPY appconfig.py ./

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Key changes vs current:
- `uv` copied from official image — no extra install step.
- `pyproject.toml` + `uv.lock` drive the install (`--frozen` ensures reproducibility).
- `appconfig.py` explicitly copied to the image root.
- `PATH` set so the `.venv` binaries are found at runtime without `uv run`.

### `.vscode/launch.json`

Single configuration **"FastAPI: Dev"**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI: Dev",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
      "envFile": "${workspaceFolder}/.env",
      "jinja": true,
      "justMyCode": true
    }
  ]
}
```

### `.vscode/tasks.json`

Tasks matching the `Makefile` targets so they are accessible from **Terminal → Run Task**:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "install",
      "type": "shell",
      "command": "uv sync",
      "group": "build"
    },
    {
      "label": "run",
      "type": "shell",
      "command": "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000",
      "group": "build",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "test",
      "type": "shell",
      "command": "uv run pytest tests/ -v",
      "group": { "kind": "test", "isDefault": true }
    },
    {
      "label": "lint",
      "type": "shell",
      "command": "uv run ruff check .",
      "group": "build"
    },
    {
      "label": "format",
      "type": "shell",
      "command": "uv run black .",
      "group": "build"
    },
    {
      "label": "check",
      "type": "shell",
      "command": "uv run ruff check . && uv run black --check .",
      "group": "build"
    }
  ]
}
```

---

## Acceptance Criteria

- [ ] `make install` installs all deps via `uv sync`.
- [ ] `make run` starts the server; `GET /api/v1/health` returns `200`.
- [ ] `make test` runs all tests and exits `0`.
- [ ] `make check` exits `0` with no code changes.
- [ ] `make docker-build` builds the image without errors.
- [ ] `make docker-run` starts the container and `GET /api/v1/health` returns `200`.
- [ ] VS Code **"FastAPI: Dev"** launch config starts the server with `.env` loaded.
- [ ] VS Code **test** task runs the test suite.

---

## Out of Scope
- CI/CD pipeline
- Multi-stage environment configs (staging, prod)
- Hot-reload inside Docker
