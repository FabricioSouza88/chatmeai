import os

from dotenv import load_dotenv

load_dotenv()

APP_NAME: str = os.getenv("APP_NAME", "chatmeai")
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./dev.db")
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")

# Azure OpenAI
AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
AZURE_OPENAI_API_VERSION: str = os.getenv(
    "AZURE_OPENAI_API_VERSION", "2024-08-01-preview"
)

# Google Calendar MCP
GOOGLE_CALENDAR_CREDENTIALS_PATH: str = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_PATH", "")
GOOGLE_CALENDAR_TOKEN_PATH: str = os.getenv("GOOGLE_CALENDAR_TOKEN_PATH", "")

# Tavily Web Search
TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
TAVILY_MAX_RESULTS: int = int(os.getenv("TAVILY_MAX_RESULTS", "3"))
