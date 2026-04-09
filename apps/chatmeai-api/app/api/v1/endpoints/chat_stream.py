from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat_service import stream_chat

router = APIRouter(tags=["chat"])


@router.post("/chat", summary="Chat with streaming SSE response")
async def chat(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
