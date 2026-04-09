from typing import Any, Literal

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class SessionStartEvent(BaseModel):
    type: Literal["session_start"] = "session_start"
    conversation_id: str
    name: str


class ThinkingEvent(BaseModel):
    type: Literal["thinking"] = "thinking"


class ToolCallEvent(BaseModel):
    type: Literal["tool_call"] = "tool_call"
    tool_name: str
    arguments: dict[str, Any]


class ToolResultEvent(BaseModel):
    type: Literal["tool_result"] = "tool_result"
    tool_name: str
    result: str


class ContentDeltaEvent(BaseModel):
    type: Literal["content_delta"] = "content_delta"
    delta: str


class DoneEvent(BaseModel):
    type: Literal["done"] = "done"
    finish_reason: str


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str


# Union used only for documentation / type hints
SSEEvent = (
    SessionStartEvent
    | ThinkingEvent
    | ToolCallEvent
    | ToolResultEvent
    | ContentDeltaEvent
    | DoneEvent
    | ErrorEvent
)
