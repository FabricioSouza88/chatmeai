from unittest.mock import MagicMock, patch

import pytest
from langchain_core.tools import BaseTool
from langgraph.graph.state import CompiledStateGraph

from app.agents.base import BaseAgent


class _StubAgent(BaseAgent):
    """Minimal concrete subclass used only in tests."""

    @property
    def system_prompt(self) -> str:
        return "You are a test stub."

    @property
    def tools(self) -> list[BaseTool]:
        return []


# ---------------------------------------------------------------------------
# Scenario 1 — abstract class cannot be instantiated directly
# ---------------------------------------------------------------------------
def test_base_agent_cannot_be_instantiated():
    with pytest.raises(TypeError):
        BaseAgent()  # type: ignore[abstract]


# ---------------------------------------------------------------------------
# Scenario 2 — concrete subclass compiles a graph
# ---------------------------------------------------------------------------
def test_stub_agent_compiles_graph():
    agent = _StubAgent()
    assert isinstance(agent.compiled, CompiledStateGraph)


# ---------------------------------------------------------------------------
# Scenario 3 — model is built with appconfig values
# ---------------------------------------------------------------------------
def test_stub_agent_model_uses_appconfig():
    mock_instance = MagicMock()
    mock_instance.bind_tools.return_value = mock_instance

    with patch(
        "app.agents.base.AzureChatOpenAI", return_value=mock_instance
    ) as mock_cls:
        import appconfig

        agent = _StubAgent()
        _ = agent.model  # trigger cached_property

        mock_cls.assert_called_once_with(
            azure_deployment=appconfig.AZURE_OPENAI_DEPLOYMENT,
            azure_endpoint=appconfig.AZURE_OPENAI_ENDPOINT,
            api_key=appconfig.AZURE_OPENAI_API_KEY,
            api_version=appconfig.AZURE_OPENAI_API_VERSION,
            streaming=True,
        )
        mock_instance.bind_tools.assert_called_once_with([])
