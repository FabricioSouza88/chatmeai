import logging
import os

from langchain_core.tools import tool
from langchain_mcp_adapters.client import MultiServerMCPClient

import appconfig
from app.tools.current_time import get_current_time
from app.tools.web_search import get_web_search_tool

logger = logging.getLogger(__name__)


@tool
async def echo(text: str) -> str:
    """Echoes the input text back. Used for testing tool execution."""
    return text


TOOLS: list = [echo, get_current_time]

if appconfig.TAVILY_API_KEY:
    try:
        TOOLS.append(get_web_search_tool())
        logger.info("Tavily web search tool loaded")
    except Exception as exc:
        logger.warning("Tavily web search tool not loaded: %s", exc)
else:
    logger.warning("TAVILY_API_KEY not set — web search tool disabled")

# References kept so MCP client objects (and their subprocesses) are not GC'd.
_mcp_clients: list = []


async def load_mcp_tools() -> None:
    """Load MCP-based tools asynchronously and extend TOOLS in-place.

    Must be called from within a running event loop (e.g., during app lifespan).
    """
    if appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH:
        try:
            env = {**os.environ, "GOOGLE_OAUTH_CREDENTIALS": appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH}
            if appconfig.GOOGLE_CALENDAR_TOKEN_PATH:
                env["GOOGLE_CALENDAR_MCP_TOKEN_PATH"] = appconfig.GOOGLE_CALENDAR_TOKEN_PATH

            cal_client = MultiServerMCPClient(
                {
                    "google-calendar": {
                        "command": "npx",
                        "args": ["-y", "@cocal/google-calendar-mcp"],
                        "env": env,
                        "transport": "stdio",
                    }
                }
            )
            calendar_tools = await cal_client.get_tools()
            TOOLS.extend(calendar_tools)
            _mcp_clients.append(cal_client)
            logger.info("Loaded %d Google Calendar tools", len(calendar_tools))
        except Exception as exc:
            logger.warning("Google Calendar MCP tools not loaded: %s", exc)

    try:
        weather_client = MultiServerMCPClient(
            {
                "weather": {
                    "command": "npx",
                    "args": ["-y", "@timlukahorstmann/mcp-weather"],
                    "transport": "stdio",
                }
            }
        )
        weather_tools = await weather_client.get_tools()
        TOOLS.extend(weather_tools)
        _mcp_clients.append(weather_client)
        logger.info("Loaded %d weather tools", len(weather_tools))
    except Exception as exc:
        logger.warning("Weather MCP tools not loaded: %s", exc)


def shutdown_mcp_tools() -> None:
    """Release MCP client references."""
    _mcp_clients.clear()
