from langchain_mcp_adapters.client import MultiServerMCPClient


async def get_weather_tools() -> list:
    """
    Connects to the Open-Meteo MCP server (@timlukahorstmann/mcp-weather)
    via stdio and returns the available tools as LangChain BaseTool instances.

    No API key or credentials required — Open-Meteo is free and public.
    Requires Node.js >= 18 to be available in the environment.
    """
    client = MultiServerMCPClient(
        {
            "weather": {
                "command": "npx",
                "args": ["-y", "@timlukahorstmann/mcp-weather"],
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()
