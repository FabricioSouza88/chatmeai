import aiosqlite
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

import appconfig
from app.db.conversations import init_conversation_names_table

_checkpointer: AsyncSqliteSaver | None = None


def _db_path() -> str:
    """Extract the raw file path from DATABASE_URL.

    Strips SQLAlchemy driver prefixes such as:
      sqlite+aiosqlite:///./dev.db  →  ./dev.db
      sqlite:///./dev.db            →  ./dev.db
    """
    url = appconfig.DATABASE_URL
    for prefix in ("sqlite+aiosqlite:///", "sqlite:///"):
        if url.startswith(prefix):
            return url[len(prefix):]
    return url


async def init_checkpointer() -> None:
    """Open a persistent aiosqlite connection and set up LangGraph checkpoint tables.

    Must be called once during app startup (lifespan). The connection stays open
    for the lifetime of the process.
    """
    global _checkpointer
    if _checkpointer is None:
        conn = await aiosqlite.connect(_db_path())
        _checkpointer = AsyncSqliteSaver(conn)
        await _checkpointer.setup()
        await init_conversation_names_table(conn)


def get_checkpointer() -> AsyncSqliteSaver:
    """Return the initialized checkpointer. Requires init_checkpointer() to have run."""
    if _checkpointer is None:
        raise RuntimeError("Checkpointer not initialized. Call init_checkpointer() at startup.")
    return _checkpointer


def get_connection() -> aiosqlite.Connection:
    """Return the underlying aiosqlite connection for direct SQL queries."""
    if _checkpointer is None:
        raise RuntimeError("Checkpointer not initialized. Call init_checkpointer() at startup.")
    return _checkpointer.conn
