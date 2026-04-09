from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def mock_settings():
    return Settings(
        APP_NAME="testapp",
        VERSION="9.9.9",
        DEBUG=False,
        DATABASE_URL="sqlite+aiosqlite:///./test.db",
    )


@pytest.fixture
def client(mock_settings):
    patches = [
        patch("app.core.config.get_settings", return_value=mock_settings),
        patch("app.api.v1.endpoints.health.get_settings", return_value=mock_settings),
    ]
    with patches[0], patches[1]:
        app = create_app()
        with TestClient(app) as c:
            yield c


def test_health_returns_200(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_response_body(client):
    response = client.get("/api/v1/health")
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == "9.9.9"
