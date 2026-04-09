# spec-0009 — List Saved Conversations

**Status:** done
**Version:** v1.0

---

## Objective

Expose an endpoint that returns all persisted conversations so that frontends (or clients) can list and resume previous sessions.

---

## Context

Conversation history is persisted in SQLite via the LangGraph `AsyncSqliteSaver` checkpointer (spec-0008). Each conversation is identified by a `thread_id` stored in the `checkpoints` table. To support session management on the frontend, the API must expose the list of saved conversations with their identifiers and timestamps.

---

## Requirements

1. The API **must** expose `GET /api/v1/conversations` returning a JSON array of conversations.
2. Each conversation object **must** include:
   - `conversation_id` — the thread identifier.
   - `created_at` — ISO 8601 timestamp of the first checkpoint.
   - `updated_at` — ISO 8601 timestamp of the most recent checkpoint.
3. Results **must** be ordered by `updated_at` descending (most recent first).
4. The endpoint **must** use the same SQLite database already used by the checkpointer (no new database connection).
5. The response **must** use HTTP 200 with `Content-Type: application/json`.

---

## Out of scope

- Pagination (can be added later).
- Filtering by date range or content.
- Returning message content or summaries.
- Authentication or ownership filtering.

---

## Dependencies

- spec-0008-conversation-memory.md (done)

---

## Acceptance criteria

1. `GET /api/v1/conversations` returns HTTP 200 with a JSON array.
2. After two distinct chat sessions, the endpoint returns at least two items with different `conversation_id` values.
3. The `updated_at` of a conversation changes after sending a new message in that session.
4. The list is ordered newest first.

---

## Implementation plan

### 1. New schema (`app/schemas/conversation.py`)

```python
class ConversationSummary(BaseModel):
    conversation_id: str
    created_at: datetime
    updated_at: datetime
```

### 2. Expose connection from checkpointer (`app/db/checkpointer.py`)

Add `get_connection() -> aiosqlite.Connection` to expose the active connection for direct SQL queries.

### 3. New endpoint (`app/api/v1/endpoints/conversations.py`)

```python
GET /conversations
```

Queries the `checkpoints` table directly:
```sql
SELECT thread_id,
       MIN(checkpoint_id) AS first_cp,
       MAX(checkpoint_id) AS last_cp
FROM checkpoints
WHERE checkpoint_ns = ''
GROUP BY thread_id
ORDER BY last_cp DESC
```

Returns a list of `ConversationSummary`. Timestamps are extracted from the ULID-encoded `checkpoint_id` using `ulid.ULID.from_str(checkpoint_id).datetime`.

### 4. Register router in `app/api/v1/router.py`
