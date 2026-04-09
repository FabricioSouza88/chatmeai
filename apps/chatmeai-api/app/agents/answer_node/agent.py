from langchain_core.tools import BaseTool

from app.agents.answer_node.prompts.system import SYSTEM_PROMPT
from app.agents.base import BaseAgent
from app.tools.registry import TOOLS


class AnswerAgent(BaseAgent):

    @property
    def system_prompt(self) -> str:
        return SYSTEM_PROMPT

    @property
    def tools(self) -> list[BaseTool]:
        return TOOLS

