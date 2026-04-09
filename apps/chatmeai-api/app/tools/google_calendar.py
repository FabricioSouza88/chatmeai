import os

from langchain_mcp_adapters.client import MultiServerMCPClient

import appconfig


async def get_google_calendar_tools() -> list:
    """
    Connects to the Google Calendar MCP Server (@cocal/google-calendar-mcp)
    via stdio and returns the available tools as LangChain BaseTool instances.

    Raises RuntimeError if credentials are not configured.
    """
    if not appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH:
        raise RuntimeError(
            "GOOGLE_CALENDAR_CREDENTIALS_PATH is not set. "
            "Configure credentials before loading Google Calendar tools."
        )

    client = MultiServerMCPClient(
        {
            "google-calendar": {
                "command": "npx",
                "args": ["-y", "@cocal/google-calendar-mcp"],
                "env": {
                    **os.environ,
                    "GOOGLE_OAUTH_CREDENTIALS": appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH,
                    **({"GOOGLE_CALENDAR_MCP_TOKEN_PATH": appconfig.GOOGLE_CALENDAR_TOKEN_PATH}
                       if appconfig.GOOGLE_CALENDAR_TOKEN_PATH else {}),
                },
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()
