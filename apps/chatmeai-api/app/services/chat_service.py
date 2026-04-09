import uuid
from collections.abc import AsyncGenerator

from langchain_core.messages import HumanMessage
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from app.agents.answer_node import AnswerAgent
from app.db.checkpointer import get_checkpointer, get_connection
from app.db.conversations import get_conversation_name, set_conversation_name
from app.tools.registry import load_mcp_tools
from app.schemas.chat import (
    ChatRequest,
    ContentDeltaEvent,
    DoneEvent,
    ErrorEvent,
    SessionStartEvent,
    ThinkingEvent,
    ToolCallEvent,
    ToolResultEvent,
)

_graph: CompiledStateGraph | None = None


async def init_graph() -> None:
    """Build and compile the agent graph with the persistent checkpointer.

    Must be called once during app startup, after init_checkpointer().
    Loads MCP tools asynchronously before compiling the graph.
    """
    global _graph
    await load_mcp_tools()
    _graph = AnswerAgent().build_graph().compile(checkpointer=get_checkpointer())


def _format_sse(event: BaseModel) -> str:
    return f"data: {event.model_dump_json()}\n\n"


async def stream_chat(request: ChatRequest) -> AsyncGenerator[str, None]:
    if _graph is None:
        raise RuntimeError("Graph not initialized. Call init_graph() at startup.")

    is_new = request.conversation_id is None
    conversation_id = request.conversation_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": conversation_id}}
    conn = get_connection()

    try:
        if is_new:
            name = await set_conversation_name(conn, conversation_id, request.message)
        else:
            name = await get_conversation_name(conn, conversation_id) or request.message[:60]

        yield _format_sse(SessionStartEvent(conversation_id=conversation_id, name=name))
        yield _format_sse(ThinkingEvent())

        input_state = {"messages": [HumanMessage(content=request.message)]}

        async for event_type, data in _graph.astream(
            input_state, config=config, stream_mode=["messages", "updates"]
        ):
            if event_type == "messages":
                chunk, metadata = data
                if metadata.get("langgraph_node") == "call_model":
                    content = chunk.content if isinstance(chunk.content, str) else ""
                    if content:
                        yield _format_sse(ContentDeltaEvent(delta=content))

            elif event_type == "updates":
                for node_name, state_update in data.items():
                    msgs = state_update.get("messages", [])

                    if node_name == "call_model":
                        for msg in msgs:
                            for tc in getattr(msg, "tool_calls", []):
                                yield _format_sse(
                                    ToolCallEvent(
                                        tool_name=tc["name"],
                                        arguments=tc.get("args", {}),
                                    )
                                )

                    elif node_name == "tools":
                        for msg in msgs:
                            yield _format_sse(
                                ToolResultEvent(
                                    tool_name=getattr(msg, "name", None) or "unknown",
                                    result=str(msg.content),
                                )
                            )

        yield _format_sse(DoneEvent(finish_reason="stop"))

    except Exception as exc:  # noqa: BLE001
        yield _format_sse(ErrorEvent(message=str(exc)))
