# Spec-0002 — Chat Routes (SSE Streaming)

## Goal
Implement the `/chat` endpoint that receives user input, calls the AI model, and streams the response back via **Server-Sent Events (SSE)** — emitting observability events for each stage (thinking, tool calls, content deltas, done/error).

---

## Scope
- New files under `app/api/v1/endpoints/`, `app/schemas/`, `app/services/`.
- Update `app/api/v1/router.py` to register the new router.
- Add `OPENAI_API_KEY` (or equivalent) to `appconfig.py` and `.env.example`.
- No auth, no persistence of messages in this spec.

---

## Directory Changes

```
app/
  api/
    v1/
      endpoints/
        chat_stream.py       # POST /chat — SSE streaming endpoint
      router.py              # Include chat router (updated)
  schemas/
    chat.py                  # ChatRequest / SSE event models
  services/
    chat_service.py          # AI model call + async event generator
appconfig.py                 # Add OPENAI_API_KEY (updated)
tests/
  unit/
    test_chat_service.py
  integration/
    test_chat_stream.py
```

---

## SSE Event Protocol

Each event is a JSON object pushed as a `data:` line in the SSE stream, with a discriminated `type` field.

### Event types

| `type` | When emitted | Payload fields |
|---|---|---|
| `thinking` | Model starts reasoning (before first token) | — |
| `tool_call` | Model invokes a tool | `tool_name`, `arguments` (dict) |
| `tool_result` | Tool returns a result | `tool_name`, `result` (str) |
| `content_delta` | Partial text token from the model | `delta` (str) |
| `done` | Stream finished successfully | `finish_reason` (str) |
| `error` | Unrecoverable error | `message` (str) |

### Wire format example

```
data: {"type": "thinking"}

data: {"type": "tool_call", "tool_name": "search", "arguments": {"query": "fastapi SSE"}}

data: {"type": "tool_result", "tool_name": "search", "result": "..."}

data: {"type": "content_delta", "delta": "Here is what I found"}

data: {"type": "done", "finish_reason": "stop"}
```

- Each event ends with a **blank line** (`\n\n`) per SSE spec.
- On error, emit one `error` event and close the stream — never leave it hanging.

---

## Files & Responsibilities

### `appconfig.py` (update)
Add:
```python
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
```

### `app/schemas/chat.py`

```python
from pydantic import BaseModel
from typing import Any, Literal

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None   # reserved for future history

class ThinkingEvent(BaseModel):
    type: Literal["thinking"] = "thinking"

class ToolCallEvent(BaseModel):
    type: Literal["tool_call"] = "tool_call"
    tool_name: str
    arguments: dict[str, Any]

class ToolResultEvent(BaseModel):
    type: Literal["tool_result"] = "tool_result"
    tool_name: str
    result: str

class ContentDeltaEvent(BaseModel):
    type: Literal["content_delta"] = "content_delta"
    delta: str

class DoneEvent(BaseModel):
    type: Literal["done"] = "done"
    finish_reason: str

class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str

# Union used only for documentation / type hints
SSEEvent = (
    ThinkingEvent
    | ToolCallEvent
    | ToolResultEvent
    | ContentDeltaEvent
    | DoneEvent
    | ErrorEvent
)
```

### `app/services/chat_service.py`

Responsibilities:
- Accept `ChatRequest` and return an `AsyncGenerator[str, None]` of raw SSE lines.
- Emit `thinking` immediately before the first API call.
- For each streamed chunk from the model:
  - If the chunk carries a tool call delta → emit `tool_call` when complete.
  - If a tool is executed → emit `tool_result`.
  - If it's a content delta → emit `content_delta`.
- On `finish_reason` → emit `done`.
- Wrap the entire generator body in `try/except`; on any exception emit `error` and return.
- **Read API key from `appconfig.OPENAI_API_KEY`** — never inline.
- Must be fully async; no blocking calls (`time.sleep`, sync HTTP clients).

```python
# Signature
async def stream_chat(request: ChatRequest) -> AsyncGenerator[str, None]:
    ...
```

Helper `_format_sse(event: BaseModel) -> str`:
```python
def _format_sse(event: BaseModel) -> str:
    return f"data: {event.model_dump_json()}\n\n"
```

### `app/api/v1/endpoints/chat_stream.py`

- `POST /chat`
- Accepts `ChatRequest` as JSON body.
- Returns `StreamingResponse` with `media_type="text/event-stream"`.
- Sets headers:
  - `Cache-Control: no-cache`
  - `X-Accel-Buffering: no`  ← disables Nginx proxy buffering
- Calls `chat_service.stream_chat(request)` and passes the generator to `StreamingResponse`.
- Thin handler — no business logic here.

```python
@router.post("/chat", summary="Chat with streaming SSE response")
async def chat(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
```

### `app/api/v1/router.py` (update)
Include `chat_stream.router` with no extra prefix (prefix already set at `main.py` level).

---

## `.env.example` (update)
Add:
```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
```

---

## New Dependencies

| Package | Purpose |
|---|---|
| `openai` | Official OpenAI async client (supports streaming + tool calls) |

No other new runtime deps — `StreamingResponse` is built into FastAPI.

---

## Tests

### Unit — `tests/unit/test_chat_service.py`
- Mock the OpenAI async client.
- Scenario 1 — **content only**: mock yields content deltas → assert `thinking` + N `content_delta` + `done` events are emitted in order.
- Scenario 2 — **tool call**: mock yields a tool call chunk followed by content → assert `thinking` + `tool_call` + `tool_result` + `content_delta` + `done`.
- Scenario 3 — **error**: mock raises an exception → assert exactly one `error` event and generator closes.

### Integration — `tests/integration/test_chat_stream.py`
- Use `httpx.AsyncClient` with the real app.
- Mock `chat_service.stream_chat` to yield a deterministic sequence of SSE lines.
- Assert:
  - Response status `200`.
  - `Content-Type: text/event-stream`.
  - Response body contains `"type": "done"`.

---

## Acceptance Criteria

- [ ] `POST /api/v1/chat` with `{"message": "hello"}` opens an SSE stream.
- [ ] First event received is `{"type": "thinking"}`.
- [ ] Stream closes with `{"type": "done", ...}` or `{"type": "error", ...}`.
- [ ] No token/key is logged or exposed in any event payload.
- [ ] `pytest` passes all new tests.
- [ ] `ruff check .` and `black --check .` exit clean.

---

## Out of Scope
- Conversation history / memory
- Authentication
- Tool definitions / registry (tools are called by the model; this spec only surfaces the events)
- Frontend implementation
