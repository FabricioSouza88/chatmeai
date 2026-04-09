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
    """Abstract base for all LangGraph agent nodes.

    Subclasses must declare:
      - system_prompt: str  — injected before every model call
      - tools: list[BaseTool] — tools bound to the model

    Everything else (model instantiation, graph wiring, compilation) is
    handled here so each specialist agent stays focused on its domain.
    """

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

    def build_graph(self) -> StateGraph:
        graph = StateGraph(MessagesState)
        graph.add_node("call_model", self._call_model)
        graph.add_node("tools", ToolNode(self.tools))
        graph.add_edge(START, "call_model")
        graph.add_conditional_edges("call_model", tools_condition)
        graph.add_edge("tools", "call_model")
        return graph

    @cached_property
    def compiled(self) -> CompiledStateGraph:
        return self.build_graph().compile()
