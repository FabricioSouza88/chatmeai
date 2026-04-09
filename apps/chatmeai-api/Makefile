.PHONY: install run test lint format check docker-build docker-run

install:
	uv sync

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	uv run pytest tests/ -v

lint:
	uv run ruff check .

format:
	uv run black .

check:
	uv run ruff check . && uv run black --check .

docker-build:
	docker build -t chatmeai .

docker-run:
	docker run --env-file .env -p 8000:8000 chatmeai
