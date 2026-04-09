from fastapi import APIRouter

from app.api.v1.endpoints import chat_stream, conversations, health

router = APIRouter()

router.include_router(health.router)
router.include_router(chat_stream.router)
router.include_router(conversations.router)
