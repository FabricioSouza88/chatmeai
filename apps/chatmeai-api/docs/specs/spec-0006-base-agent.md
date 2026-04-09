# Spec-0006 — BaseAgent Abstract Class

## Goal
Introduce a `BaseAgent` abstract class that encapsulates the elements common to every agent node: model instantiation, system prompt injection, graph compilation, and the public `compiled` property. Each specialist agent inherits from `BaseAgent` and only declares its tools and system prompt.

---

## Scope
- Create `app/agents/base.py` with the `BaseAgent` ABC.
- Refactor `app/agents/answer_node/agent.py` to use `BaseAgent`.
- No changes to `chat_service.py`, schemas, endpoints, or tests beyond import path updates.
- All existing tests must pass.

---

## Directory Changes

```
app/agents/
  base.py                       # NEW — BaseAgent ABC
  answer_node/
    agent.py                    # UPDATED — extends BaseAgent
    __init__.py                 # Unchanged
    prompts/
      system.py                 # Unchanged
```

---

## Architecture

### What BaseAgent encapsulates

| Concern | Where it lives today | After this spec |
|---|---|---|
| `AzureChatOpenAI` instantiation | Each `agent.py` | `BaseAgent._build_model()` |
| Lazy model singleton | Each `agent.py` (`_get_model`) | `BaseAgent.model` (cached property) |
| System prompt injection | Each `agent.py` (`_call_model`) | `BaseAgent._call_model()` |
| `StateGraph` construction + compile | Each `agent.py` | `BaseAgent._build_graph()` + `BaseAgent.compiled` |
| Tools list | Each `agent.py` (hardcoded) | Abstract property `BaseAgent.tools` |
| System prompt string | Each `agent.py` (hardcoded import) | Abstract property `BaseAgent.system_prompt` |

### Class design

```python
# app/agents/base.py
from abc import ABC, abstractmethod
from functools import cached_property
from langchain_core.messages import SystemMessage
from langchain_core.tools import BaseTool
from langchain_openai import AzureChatOpenAI
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition
import appconfig


class BaseAgent(ABC):

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt injected before every model call."""

    @property
    @abstractmethod
    def tools(self) -> list[BaseTool]:
        """LangChain tools available to this agent."""

    @cached_property
    def model(self) -> AzureChatOpenAI:
        return AzureChatOpenAI(
            azure_deployment=appconfig.AZURE_OPENAI_DEPLOYMENT,
            azure_endpoint=appconfig.AZURE_OPENAI_ENDPOINT,
            api_key=appconfig.AZURE_OPENAI_API_KEY,
            api_version=appconfig.AZURE_OPENAI_API_VERSION,
            streaming=True,
        ).bind_tools(self.tools)

    async def _call_model(self, state: MessagesState) -> dict:
        messages = [SystemMessage(content=self.system_prompt), *state["messages"]]
        response = await self.model.ainvoke(messages)
        return {"messages": [response]}

    def _build_graph(self) -> StateGraph:
        graph = StateGraph(MessagesState)
        graph.add_node("call_model", self._call_model)
        graph.add_node("tools", ToolNode(self.tools))
        graph.add_edge(START, "call_model")
        graph.add_conditional_edges("call_model", tools_condition)
        graph.add_edge("tools", "call_model")
        return graph

    @cached_property
    def compiled(self) -> CompiledStateGraph:
        return self._build_graph().compile()
```

### AnswerAgent (refactored)

```python
# app/agents/answer_node/agent.py
from langchain_core.tools import BaseTool
from app.agents.base import BaseAgent
from app.agents.answer_node.prompts.system import SYSTEM_PROMPT
from app.tools.registry import TOOLS


class AnswerAgent(BaseAgent):

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    @property
    def tools(self) -> list[BaseTool]:
        return TOOLS


# Module-level singleton — consumed by chat_service and __init__.py
answer_agent = AnswerAgent().compiled
```

---

## Tests

### `tests/unit/test_base_agent.py` (new)

Three scenarios:

**Scenario 1 — cannot instantiate abstract class:**
- Assert `BaseAgent()` raises `TypeError`.

**Scenario 2 — concrete subclass compiles graph:**
- Create a minimal `_StubAgent(BaseAgent)` with hardcoded `system_prompt` and `tools = []`.
- Assert `_StubAgent().compiled` is a `CompiledStateGraph`.

**Scenario 3 — model is built with correct config:**
- Mock `AzureChatOpenAI` constructor in `app.agents.base`.
- Call `_StubAgent().model`.
- Assert constructor was called with `appconfig.AZURE_OPENAI_DEPLOYMENT`, etc.

### `tests/unit/test_answer_node.py` (update)

Update mock path from `app.agents.answer_node.agent._get_model` → patch `app.agents.base.AzureChatOpenAI` or mock `AnswerAgent.model` directly via `PropertyMock`.

---

## Acceptance Criteria

- [ ] `BaseAgent` is importable from `app.agents.base`.
- [ ] `AnswerAgent` extends `BaseAgent` and compiles without errors.
- [ ] `from app.agents.answer_node import answer_agent` still works unchanged.
- [ ] `pytest` passes all 10+ tests (including new `test_base_agent.py`).
- [ ] `ruff check .` and `black --check .` exit clean.

---

## Out of Scope
- Overriding `_build_graph()` per-agent (custom topologies)
- BaseAgent with memory / checkpointer support
- Multiple model providers beyond Azure OpenAI
