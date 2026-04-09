# Spec-0005 — Answer Node Refactor (Package Structure)

## Goal
Convert `app/agents/answer_node.py` (single flat file) into a **package folder** `app/agents/answer_node/`, separating agent logic from prompt definitions. This sets the convention for all future agent packages.

---

## Scope
- Restructure `app/agents/answer_node.py` → `app/agents/answer_node/` package.
- Extract prompt text into `app/agents/answer_node/prompts/`.
- Keep the public API (`answer_agent`) reachable at the same import path: `from app.agents.answer_node import answer_agent`.
- Update unit tests to reflect new internal module paths.
- No functional behavior changes — all existing tests must still pass.

---

## Directory Changes

```
app/agents/
  answer_node/                  # NEW — replaces answer_node.py
    __init__.py                 # Re-exports answer_agent (preserves import path)
    agent.py                    # Agent graph logic (moved from answer_node.py)
    prompts/
      __init__.py
      system.py                 # System prompt constant(s) for this agent
answer_node.py                  # DELETED
```

Full tree after this spec:
```
app/
  agents/
    __init__.py
    answer_node/
      __init__.py
      agent.py
      prompts/
        __init__.py
        system.py
  tools/
    __init__.py
    registry.py
  services/
    chat_service.py             # No changes
  ...
```

---

## Files & Responsibilities

### `app/agents/answer_node/prompts/system.py`

Defines the system prompt used by the answer agent. Centralised here so it can be versioned, tested, and swapped independently of the graph logic.

```python
SYSTEM_PROMPT = (
    "You are a helpful assistant. "
    "Answer the user's questions clearly and concisely. "
    "When you have access to tools, use them when appropriate."
)
```

### `app/agents/answer_node/prompts/__init__.py`

Empty — makes `prompts/` a package.

### `app/agents/answer_node/agent.py`

Moves all logic from the old `answer_node.py` here, plus:
- Imports `SYSTEM_PROMPT` from `.prompts.system`.
- Prepends the system prompt to messages before invoking the model:

```python
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.answer_node.prompts.system import SYSTEM_PROMPT

async def _call_model(state: MessagesState):
    messages = [SystemMessage(content=SYSTEM_PROMPT), *state["messages"]]
    response = await _get_model().ainvoke(messages)
    return {"messages": [response]}
```

Everything else (lazy `_get_model`, `StateGraph`, `answer_agent = _graph.compile()`) stays the same.

### `app/agents/answer_node/__init__.py`

Re-exports `answer_agent` so that existing imports (`from app.agents.answer_node import answer_agent`) keep working without changes anywhere else.

```python
from app.agents.answer_node.agent import answer_agent

__all__ = ["answer_agent"]
```

---

## Tests

### `tests/unit/test_answer_node.py` (update)

Update mock patch path from `app.agents.answer_node._get_model` to `app.agents.answer_node.agent._get_model`.

No new test scenarios needed — same 2 scenarios, corrected paths.

---

## Acceptance Criteria

- [ ] `from app.agents.answer_node import answer_agent` works unchanged in `chat_service.py`.
- [ ] `app/agents/answer_node.py` flat file is deleted.
- [ ] `app/agents/answer_node/prompts/system.py` contains `SYSTEM_PROMPT`.
- [ ] `app/agents/answer_node/agent.py` prepends `SystemMessage(SYSTEM_PROMPT)` before invoking the model.
- [ ] `pytest` passes all 10+ tests.
- [ ] `ruff check .` and `black --check .` exit clean.

---

## Out of Scope
- Changing the system prompt content beyond the stub
- Multiple prompt variants / prompt versioning
- Adding new agent nodes
