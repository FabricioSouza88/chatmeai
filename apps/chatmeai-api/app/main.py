from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import get_settings
from app.db.checkpointer import init_checkpointer
from app.services.chat_service import init_graph
from app.tools.registry import shutdown_mcp_tools


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_checkpointer()
    await init_graph()
    yield
    shutdown_mcp_tools()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(v1_router, prefix="/api/v1")
    return app


app = create_app()
