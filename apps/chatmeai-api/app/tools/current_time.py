from datetime import datetime, timezone

from langchain_core.tools import tool


@tool
def get_current_time() -> str:
    """Returns the current UTC date and time in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()
