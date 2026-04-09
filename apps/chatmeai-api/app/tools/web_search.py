from langchain_tavily import TavilySearch

import appconfig


def get_web_search_tool() -> TavilySearch:
    return TavilySearch(
        max_results=appconfig.TAVILY_MAX_RESULTS,
        tavily_api_key=appconfig.TAVILY_API_KEY,
    )
