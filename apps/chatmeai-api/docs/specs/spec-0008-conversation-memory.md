# spec-0008 — Conversation Memory with SQLite

**Status:** done
**Version:** v1.0

---

## Objective

Add persistent conversation memory so that the agent can answer follow-up questions that reference context from earlier messages in the same session (e.g., "Qual a capital da França?" → "E qual a população dela?").

---

## Context

Currently, `chat_service.py` builds a fresh `MessagesState` on every request, discarding all prior turns. `ChatRequest` already has a `conversation_id` field reserved for this purpose. LangGraph natively supports conversation persistence via checkpointers (`AsyncSqliteSaver`), making this a low-impact integration. The project already has SQLAlchemy + SQLite configured.

---

## Requirements

1. The system **must** persist conversation history per `conversation_id` using LangGraph's `AsyncSqliteSaver` as the graph checkpointer.
2. When the client sends `conversation_id: null` (or omits it), the backend **must** generate a new UUID v4 and use it as the session identifier.
3. The backend **must** emit a `session_start` SSE event as the first event of every response, containing the active `conversation_id`.
4. On subsequent requests with the same `conversation_id`, the agent **must** have access to all prior messages from that session.
5. The SQLite database file **must** be the same file already configured in `DATABASE_URL` (no new database).
6. The checkpointer **must** be initialized once at application startup and shared across requests (singleton).

---

## Out of scope

- Expiration or deletion of old conversations.
- Authentication / ownership of conversations (any client can use any `conversation_id`).
- Multi-user isolation beyond the `conversation_id` token.
- Migrating or seeding the SQLite schema manually — LangGraph's checkpointer handles its own table creation.

---

## Dependencies

- spec-0004-langgraph.md (done)
- spec-0005-answer-node-refactor.md (done)

---

## Acceptance criteria

1. Given two sequential requests with the same `conversation_id`:
   - Request 1: `"Qual a capital da França?"` → agent answers "Paris".
   - Request 2: `"E qual a população dela?"` → agent answers with Paris's population without the city being mentioned again.
2. Given a request with `conversation_id: null`, the response **must** include a `session_start` event with a non-null `conversation_id`.
3. Given a new server restart, an existing `conversation_id` **must** still retrieve its prior history from SQLite.
4. Concurrent requests with different `conversation_id`s **must not** share history.

---

## Implementation plan

### 1. New SSE event — `SessionStartEvent` (`app/schemas/chat.py`)

```python
class SessionStartEvent(BaseModel):
    type: Literal["session_start"] = "session_start"
    conversation_id: str
```

Add to `SSEEvent` union.

### 2. Checkpointer singleton (`app/db/checkpointer.py`)

```python
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

_checkpointer: AsyncSqliteSaver | None = None

async def get_checkpointer() -> AsyncSqliteSaver:
    global _checkpointer
    if _checkpointer is None:
        db_path = <path extracted from DATABASE_URL>
        _checkpointer = AsyncSqliteSaver.from_conn_string(db_path)
    return _checkpointer
```

Initialize on app startup via `lifespan` in `main.py`.

### 3. Inject checkpointer into the supervisor graph (`app/services/chat_service.py`)

- At startup, compile the graph with `checkpointer=await get_checkpointer()`.
- In `stream_chat`, resolve `conversation_id` (generate UUID if absent).
- Emit `SessionStartEvent` as the first SSE event.
- Pass `config={"configurable": {"thread_id": conversation_id}}` to `astream_events`.

### 4. No changes required to `BaseAgent` or `AnswerAgent`.

---

## SSE event flow (updated)

```
data: {"type":"session_start","conversation_id":"<uuid>"}

data: {"type":"thinking"}

data: {"type":"content_delta","delta":"Paris..."}

data: {"type":"done","finish_reason":"stop"}
```
