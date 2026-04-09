from functools import lru_cache

from pydantic_settings import BaseSettings  # noqa: E402

import appconfig


class Settings(BaseSettings):
    APP_NAME: str = appconfig.APP_NAME
    DEBUG: bool = appconfig.DEBUG
    DATABASE_URL: str = appconfig.DATABASE_URL
    CORS_ORIGINS: list[str] = appconfig.CORS_ORIGINS
    VERSION: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
