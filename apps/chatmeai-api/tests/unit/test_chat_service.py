import json
from unittest.mock import MagicMock, patch

import pytest
from langchain_core.messages import AIMessageChunk

from app.schemas.chat import ChatRequest
from app.services import chat_service
from app.services.chat_service import stream_chat


async def _async_iter(items):
    for item in items:
        yield item


def _parse_events(lines: list[str]) -> list[dict]:
    return [
        json.loads(line.removeprefix("data: ").strip())
        for line in lines
        if line.startswith("data:")
    ]


def _content_event(text: str) -> dict:
    chunk = MagicMock(spec=AIMessageChunk)
    chunk.content = text
    return {"event": "on_chat_model_stream", "data": {"chunk": chunk}}


def _chain_end_event() -> dict:
    return {"event": "on_chain_end", "name": "LangGraph", "data": {}}


def _tool_start_event(name: str, inputs: dict) -> dict:
    return {"event": "on_tool_start", "name": name, "data": {"input": inputs}}


def _tool_end_event(name: str, output: str) -> dict:
    return {"event": "on_tool_end", "name": name, "data": {"output": output}}


# ---------------------------------------------------------------------------
# Scenario 1 — content only
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_chat_content_only():
    events = [
        _content_event("Hello"),
        _content_event(" world"),
        _chain_end_event(),
    ]

    with patch.object(
        chat_service._graph, "astream_events", return_value=_async_iter(events)
    ):
        request = ChatRequest(message="hi")
        lines = [line async for line in stream_chat(request)]

    parsed = _parse_events(lines)
    types = [e["type"] for e in parsed]

    assert types[0] == "thinking"
    assert types.count("content_delta") == 2
    assert types[-1] == "done"
    assert parsed[-1]["finish_reason"] == "stop"


# ---------------------------------------------------------------------------
# Scenario 2 — tool call
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_chat_tool_call():
    events = [
        _tool_start_event("echo", {"text": "hello"}),
        _tool_end_event("echo", "hello"),
        _content_event("Done!"),
        _chain_end_event(),
    ]

    with patch.object(
        chat_service._graph, "astream_events", return_value=_async_iter(events)
    ):
        request = ChatRequest(message="call a tool")
        lines = [line async for line in stream_chat(request)]

    parsed = _parse_events(lines)
    types = [e["type"] for e in parsed]

    assert types[0] == "thinking"
    assert "tool_call" in types
    assert "tool_result" in types
    assert "content_delta" in types
    assert types[-1] == "done"


# ---------------------------------------------------------------------------
# Scenario 3 — error
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_chat_error():
    async def _raise():
        raise RuntimeError("API unreachable")
        yield  # make it an async generator

    with patch.object(chat_service._graph, "astream_events", return_value=_raise()):
        request = ChatRequest(message="hi")
        lines = [line async for line in stream_chat(request)]

    parsed = _parse_events(lines)
    error_events = [e for e in parsed if e["type"] == "error"]

    assert len(error_events) == 1
    assert "API unreachable" in error_events[0]["message"]
    # Stream must close — no hanging events after error
