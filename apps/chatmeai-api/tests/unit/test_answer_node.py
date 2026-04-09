from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph.state import CompiledStateGraph

from app.agents.answer_node import answer_agent
from app.agents.answer_node.agent import AnswerAgent


# ---------------------------------------------------------------------------
# Scenario 1 — subgraph compiles correctly
# ---------------------------------------------------------------------------
def test_answer_agent_is_compiled_graph():
    assert isinstance(answer_agent, CompiledStateGraph)


# ---------------------------------------------------------------------------
# Scenario 2 — subgraph invokes model and returns AIMessage
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_answer_agent_invokes_model():
    ai_response = AIMessage(content="Hello from mock!")
    mock_model = MagicMock()
    mock_model.ainvoke = AsyncMock(return_value=ai_response)
    mock_model.bind_tools.return_value = mock_model

    with patch("app.agents.base.AzureChatOpenAI", return_value=mock_model):
        agent = AnswerAgent()
        result = await agent.compiled.ainvoke(
            {"messages": [HumanMessage(content="hello")]}
        )

    messages = result["messages"]
    assert any(isinstance(m, AIMessage) for m in messages)
    ai_messages = [m for m in messages if isinstance(m, AIMessage)]
    assert ai_messages[-1].content == "Hello from mock!"
