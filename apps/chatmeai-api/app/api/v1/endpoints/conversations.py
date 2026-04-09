from datetime import datetime, timezone

from fastapi import APIRouter
from langgraph.checkpoint.base.id import UUID as LGUuid

from app.db.checkpointer import get_connection
from app.schemas.conversation import ConversationSummary

router = APIRouter(tags=["conversations"])

# 100-ns intervals between the Gregorian epoch (1582-10-15) and Unix epoch (1970-01-01)
_GREGORIAN_OFFSET = 122192928000000000


def _checkpoint_id_to_datetime(checkpoint_id: str) -> datetime:
    """Extract UTC datetime from a UUID v6 checkpoint_id.

    Uses LangGraph's UUID subclass which correctly reconstructs the Gregorian
    timestamp from UUID v6's reordered bit layout (standard uuid.UUID.time
    assumes UUID v1 ordering and returns a wrong value for v6).
    """
    ts_100ns = LGUuid(checkpoint_id).time - _GREGORIAN_OFFSET
    return datetime.fromtimestamp(ts_100ns / 1e7, tz=timezone.utc)


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations() -> list[ConversationSummary]:
    """Return all saved conversations ordered by most recently updated."""
    conn = get_connection()
    query = """
        SELECT c.thread_id,
               MIN(c.checkpoint_id) AS first_cp,
               MAX(c.checkpoint_id) AS last_cp,
               COALESCE(n.name, c.thread_id) AS name
        FROM checkpoints c
        LEFT JOIN conversation_names n ON n.thread_id = c.thread_id
        WHERE c.checkpoint_ns = ''
        GROUP BY c.thread_id
        ORDER BY last_cp DESC
    """
    async with conn.execute(query) as cur:
        rows = await cur.fetchall()

    return [
        ConversationSummary(
            conversation_id=thread_id,
            name=name,
            created_at=_checkpoint_id_to_datetime(first_cp),
            updated_at=_checkpoint_id_to_datetime(last_cp),
        )
        for thread_id, first_cp, last_cp, name in rows
    ]
