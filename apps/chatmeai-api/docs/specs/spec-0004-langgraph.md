# Spec-0004 — LangGraph Chat Service

## Goal
Replace the manual OpenAI streaming loop in `chat_service.py` with a **LangGraph** agent graph — enabling real tool execution, built-in conversation history, and structured streaming events — without changing the SSE endpoint or schemas.

---

## Scope
- Rewrite `app/services/chat_service.py` as an **orchestrator** that builds the supervisor graph.
- Create `app/agents/` folder to house individual agent nodes.
- Create `app/agents/answer_node.py` as the first specialist node (basic LLM chat).
- Add tool definitions under `app/tools/`.
- Update `appconfig.py` with any new env vars.
- Update `pyproject.toml` with new deps.
- Update existing unit tests; integration tests unchanged.

**Not in scope (this spec):** persistent checkpointing, auth, frontend, real specialist agents beyond the stub.

---

## Directory Changes

```
app/
  agents/
    __init__.py
    answer_node.py        # Answer agent node — basic LLM chat (first specialist)
    # (future) mcp_node.py, research_node.py, ...
  services/
    chat_service.py       # Orchestrator: builds supervisor graph, streams SSE
  tools/
    __init__.py
    registry.py           # Tool definitions decorated with @tool (echo stub)
appconfig.py              # No new vars needed (reuses AZURE_OPENAI_* vars)
pyproject.toml            # Add langgraph, langchain-openai
tests/
  unit/
    test_chat_service.py  # Updated to mock LangGraph events
    test_answer_node.py   # Unit tests for the answer node
```

---

## Architecture

### Multi-Agent Orchestration (Supervisor Pattern)

```
stream_chat(request)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Supervisor Graph  (chat_service.py)                        │
│                                                             │
│   START                                                     │
│     │                                                       │
│     ▼                                                       │
│   [supervisor_node]  ──── routes to agent ────►            │
│     ▲                                          │            │
│     │                                          ▼            │
│     │    ┌──────────────────────────────────────────────┐  │
│     │    │  Answer Agent Subgraph  (answer_node.py)     │  │
│     │    │                                              │  │
│     │    │   call_model ──► tools_condition ──► tools   │  │
│     │    │        ▲                │                    │  │
│     │    │        └────────────────┘                    │  │
│     └────┤  (returns to supervisor when done)           │  │
│          └──────────────────────────────────────────────┘  │
│                                                             │
│   (future nodes: mcp_agent, research_agent, ...)           │
│                                                             │
│   END                                                       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
graph.astream_events()  →  map events to SSE types  →  yield SSE lines
```

### Design Rationale

| Decision | Reason |
|---|---|
| `/agents/` folder (not `/nodes/`) | "Agents" conveys autonomy and state — nodes are an implementation detail |
| Each agent = compiled subgraph | Subgraphs are isolated, testable, and composable into any supervisor |
| Supervisor in `chat_service.py` | Service layer owns orchestration; agents stay pure and reusable |
| Single agent initially | Structure is ready for N agents; routing logic is a no-op stub until needed |

### Extensibility Path

Adding a new specialist agent in a future spec is **additive only**:
1. Create `app/agents/<name>_node.py` with its own subgraph + tools.
2. Register it in the supervisor routing table in `chat_service.py`.
3. No changes to existing agents, endpoint, or SSE schema.

---

## SSE Event Mapping

| LangGraph event name | `on_*` trigger | SSE type emitted |
|---|---|---|
| — | Before first `astream_events` call | `thinking` |
| `on_chat_model_stream` | Content token received | `content_delta` |
| `on_tool_start` | Tool invocation begins | `tool_call` |
| `on_tool_end` | Tool returns result | `tool_result` |
| `on_chain_end` (root graph) | Graph finishes | `done` |
| any unhandled exception | `except` block | `error` |

---

## Files & Responsibilities

### `app/agents/answer_node.py` (new)

Responsibilities:
- Own the `AzureChatOpenAI` model instance and `TOOLS` binding.
- Build and compile an internal `StateGraph(MessagesState)` with `call_model` and `tools` nodes.
- Export a **compiled subgraph** (`answer_agent`) consumed by the supervisor.
- Has no knowledge of SSE or HTTP — pure agent logic.

```python
from langchain_openai import AzureChatOpenAI
from langgraph.graph import StateGraph, START, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
import appconfig
from app.tools.registry import TOOLS

_model = AzureChatOpenAI(
    azure_deployment=appconfig.AZURE_OPENAI_DEPLOYMENT,
    azure_endpoint=appconfig.AZURE_OPENAI_ENDPOINT,
    api_key=appconfig.AZURE_OPENAI_API_KEY,
    api_version=appconfig.AZURE_OPENAI_API_VERSION,
    streaming=True,
).bind_tools(TOOLS)

async def _call_model(state: MessagesState):
    response = await _model.ainvoke(state["messages"])
    return {"messages": [response]}

_graph = StateGraph(MessagesState)
_graph.add_node("call_model", _call_model)
_graph.add_node("tools", ToolNode(TOOLS))
_graph.add_edge(START, "call_model")
_graph.add_conditional_edges("call_model", tools_condition)
_graph.add_edge("tools", "call_model")

answer_agent = _graph.compile()  # exported subgraph
```

### `app/tools/registry.py`

- Define tools as plain async functions decorated with `@tool` (LangChain).
- Start with one stub tool (`echo`) for testing; real tools added in future specs.
- Export `TOOLS: list` consumed by `chat_service.py`.

```python
from langchain_core.tools import tool

@tool
async def echo(text: str) -> str:
    """Echoes the input text back. Used for testing tool execution."""
    return text

TOOLS = [echo]
```

### `app/services/chat_service.py` (rewrite — orchestrator)

Responsibilities:
- Build the **supervisor graph**: a top-level `StateGraph` that routes incoming messages to agent subgraphs.
- In this spec, routing is a passthrough to `answer_agent` (single agent, no LLM-based routing needed yet).
- When multi-agent routing is added, only this file changes — agents stay untouched.
- `stream_chat()` signature **unchanged**: `async def stream_chat(request: ChatRequest) -> AsyncGenerator[str, None]`.
- Inside `stream_chat`:
  1. Yield `thinking` event immediately.
  2. Call `_graph.astream_events({"messages": [...]}, version="v2")`.
  3. Map each event to the corresponding SSE type (see table above).
  4. Wrap in `try/except`; yield `error` on exception.

```python
# Key imports
from langgraph.graph import StateGraph, START, MessagesState
from app.agents.answer_node import answer_agent
```

Supervisor graph (initially a passthrough, ready for multi-agent routing):
```python
# Supervisor: routes to the appropriate agent subgraph.
# Currently only one agent — routing is a no-op wrapper.
# To add a new agent: add a node + conditional edge here.
async def _supervisor_route(state: MessagesState):
    """Routing logic — currently routes everything to answer_agent."""
    return state  # passthrough; future: inspect state to choose agent

_supervisor = StateGraph(MessagesState)
_supervisor.add_node("supervisor", _supervisor_route)
_supervisor.add_node("answer_agent", answer_agent)  # subgraph as node
_supervisor.add_edge(START, "supervisor")
_supervisor.add_edge("supervisor", "answer_agent")
_graph = _supervisor.compile()
```

> **Future multi-agent routing**: Replace `add_edge("supervisor", "answer_agent")` with `add_conditional_edges("supervisor", _pick_agent)` where `_pick_agent` inspects message intent and returns the target agent name.

### `pyproject.toml` (update)

Add to `dependencies`:

| Package | Purpose |
|---|---|
| `langgraph>=0.2.0` | Graph orchestration |
| `langchain-openai>=0.1.0` | `AzureChatOpenAI` + LangChain OpenAI integration |

Remove `openai` direct dependency (transitively provided by `langchain-openai`).

---

## Tests

### Unit — `tests/unit/test_chat_service.py` (update)

Replace the OpenAI client mock with a LangGraph `astream_events` mock on `_graph` (supervisor graph in `chat_service`).

Scenarios (same 3 as before, different mock target):

**Scenario 1 — content only:**
- Mock `chat_service._graph.astream_events` to yield:
  - `{"event": "on_chat_model_stream", "data": {"chunk": AIMessageChunk(content="Hello")}}`
  - `{"event": "on_chain_end", "name": "LangGraph", ...}`
- Assert: `thinking` → `content_delta` → `done` in order.

**Scenario 2 — tool call:**
- Mock yields `on_tool_start`, `on_tool_end`, then content stream.
- Assert: `thinking` → `tool_call` → `tool_result` → `content_delta` → `done`.

**Scenario 3 — error:**
- Mock raises an exception inside the async generator.
- Assert: exactly one `error` event, generator closes cleanly.

### Unit — `tests/unit/test_answer_node.py` (new)

Test the answer node in isolation, independent of the supervisor.

**Scenario 1 — node compiles:**
- Assert `answer_agent` is a valid compiled graph (`CompiledStateGraph`).

**Scenario 2 — node invokes model:**
- Mock `answer_node._model.ainvoke` to return `AIMessage(content="Hi")`.
- Call `answer_agent.ainvoke({"messages": [HumanMessage(content="hello")]})`.
- Assert response messages contain `AIMessage`.

---

## Acceptance Criteria

- [ ] `POST /api/v1/chat` still returns SSE stream with same event protocol.
- [ ] First event is `{"type": "thinking"}`.
- [ ] `on_tool_start` emits `tool_call`; `on_tool_end` emits `tool_result`.
- [ ] Stream closes with `done` or `error`.
- [ ] `answer_agent` subgraph is isolated in `app/agents/answer_node.py`.
- [ ] `chat_service.py` builds a supervisor graph that delegates to `answer_agent`.
- [ ] `pytest` passes all 8+ tests (including new `test_answer_node.py`).
- [ ] `ruff check .` and `black --check .` exit clean.
- [ ] No secrets or API keys appear in any SSE event payload.

---

## Out of Scope (This Spec)
- Persistent memory / checkpointing (LangGraph `MemorySaver`)
- LLM-based supervisor routing (multi-agent conditional routing)
- Real specialist agents (MCP connector, web search, etc.)
- Real tool implementations beyond the `echo` stub
- Conversation history across HTTP requests

---

## Future Specs Roadmap (Not Implemented Here)

This spec lays the foundation for the following future work:

| Spec | Description |
|---|---|
| spec-0005-mcp-agent | Create `app/agents/mcp_node.py` as a specialist agent that connects to external MCP servers via `langchain-mcp-adapters`. Register in supervisor. |
| spec-0006-supervisor-routing | Replace passthrough supervisor with LLM-based routing (intent classification → agent selection). |
| spec-0007-memory | Add `MemorySaver` checkpointer to both agent subgraphs and supervisor for cross-request conversation history. |
| spec-0008-real-tools | Replace `echo` stub with real tools (e.g., web search, file reader, SQL query). |
