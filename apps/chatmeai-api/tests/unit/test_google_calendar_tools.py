from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import appconfig
from app.tools.google_calendar import get_google_calendar_tools


# ---------------------------------------------------------------------------
# Scenario 1 — raises RuntimeError when credentials not set
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_raises_when_credentials_not_set():
    with patch.object(appconfig, "GOOGLE_CALENDAR_CREDENTIALS_PATH", ""):
        with pytest.raises(RuntimeError, match="GOOGLE_CALENDAR_CREDENTIALS_PATH"):
            await get_google_calendar_tools()


# ---------------------------------------------------------------------------
# Scenario 2 — calls MultiServerMCPClient with correct config
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_calls_mcp_client_with_correct_config():
    fake_tool = MagicMock()

    mock_client_instance = MagicMock()
    mock_client_instance.get_tools = AsyncMock(return_value=[fake_tool])

    with (
        patch.object(appconfig, "GOOGLE_CALENDAR_CREDENTIALS_PATH", "/fake/credentials.json"),
        patch.object(appconfig, "GOOGLE_CALENDAR_TOKEN_PATH", "/fake/token.json"),
        patch(
            "app.tools.google_calendar.MultiServerMCPClient",
            return_value=mock_client_instance,
        ) as mock_client_cls,
    ):
        result = await get_google_calendar_tools()

    mock_client_cls.assert_called_once_with(
        {
            "google-calendar": {
                "command": "npx",
                "args": [
                    "-y",
                    "@modelcontextprotocol/server-google-calendar",
                    "--credentials",
                    "/fake/credentials.json",
                    "--token",
                    "/fake/token.json",
                ],
                "transport": "stdio",
            }
        }
    )
    assert result == [fake_tool]


# ---------------------------------------------------------------------------
# Scenario 3 — registry falls back to base tools when MCP fails
# ---------------------------------------------------------------------------
def test_registry_falls_back_when_mcp_fails():
    with patch(
        "app.tools.registry.get_google_calendar_tools",
        side_effect=RuntimeError("MCP unavailable"),
    ):
        from app.tools.registry import _load_tools

        tools = _load_tools()

    assert len(tools) == 1
    assert tools[0].name == "echo"
