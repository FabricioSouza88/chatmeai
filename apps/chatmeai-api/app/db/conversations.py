import aiosqlite

_MAX_NAME_LEN = 60


def _truncate(text: str) -> str:
    text = text.strip()
    if len(text) <= _MAX_NAME_LEN:
        return text
    return text[:_MAX_NAME_LEN] + "\u2026"


async def init_conversation_names_table(conn: aiosqlite.Connection) -> None:
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS conversation_names (
            thread_id TEXT PRIMARY KEY,
            name      TEXT NOT NULL
        )
        """
    )
    await conn.commit()


async def set_conversation_name(
    conn: aiosqlite.Connection, thread_id: str, first_message: str
) -> str:
    """Persist a conversation name derived from the first message.

    Does nothing if the thread already has a name (INSERT OR IGNORE).
    Returns the name that was stored.
    """
    name = _truncate(first_message)
    await conn.execute(
        "INSERT OR IGNORE INTO conversation_names (thread_id, name) VALUES (?, ?)",
        (thread_id, name),
    )
    await conn.commit()
    return name


async def get_conversation_name(
    conn: aiosqlite.Connection, thread_id: str
) -> str | None:
    async with conn.execute(
        "SELECT name FROM conversation_names WHERE thread_id = ?", (thread_id,)
    ) as cur:
        row = await cur.fetchone()
    return row[0] if row else None
