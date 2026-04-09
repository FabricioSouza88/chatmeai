from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.tools.registry import TOOLS

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str
    tools: list[str]


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        tools=[t.name for t in TOOLS],
    )
