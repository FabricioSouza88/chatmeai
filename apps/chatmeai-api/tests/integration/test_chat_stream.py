import json
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.chat import ContentDeltaEvent, DoneEvent, ThinkingEvent


async def _fake_stream(_request) -> AsyncGenerator[str, None]:
    yield f"data: {ThinkingEvent().model_dump_json()}\n\n"
    yield f"data: {ContentDeltaEvent(delta='hello').model_dump_json()}\n\n"
    yield f"data: {DoneEvent(finish_reason='stop').model_dump_json()}\n\n"


@pytest.mark.asyncio
async def test_chat_stream_status_and_content_type():
    with patch(
        "app.api.v1.endpoints.chat_stream.stream_chat", side_effect=_fake_stream
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/chat", json={"message": "hello"})

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_chat_stream_body_contains_done():
    with patch(
        "app.api.v1.endpoints.chat_stream.stream_chat", side_effect=_fake_stream
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/chat", json={"message": "hello"})

    lines = [line for line in response.text.splitlines() if line.startswith("data:")]
    events = [json.loads(line.removeprefix("data: ")) for line in lines]
    types = [e["type"] for e in events]

    assert types[0] == "thinking"
    assert "done" in types
