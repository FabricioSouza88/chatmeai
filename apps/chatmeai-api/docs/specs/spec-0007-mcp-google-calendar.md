# Spec-0007 — MCP Google Calendar Tool

## Goal

Integrar o Google Calendar ao `AnswerAgent` via MCP, permitindo que o assistente leia compromissos do usuário em linguagem natural. A tool é carregada a partir de um MCP Server local (`@modelcontextprotocol/server-google-calendar`) usando `langchain-mcp-adapters`, e adicionada à lista de tools do agente existente.

---

## Scope

- Adicionar `langchain-mcp-adapters` ao `pyproject.toml`.
- Criar `app/tools/google_calendar.py` — factory assíncrona que conecta ao MCP Server e retorna as tools.
- Atualizar `app/tools/registry.py` para incluir as tools do Google Calendar.
- Atualizar `app/agents/answer_node/prompts/system.py` com instruções sobre o calendário.
- Atualizar `appconfig.py` com as variáveis de ambiente necessárias para autenticação OAuth.
- Documentar o setup do MCP Server e das credenciais Google.
- Adicionar testes unitários para a factory de tools.

Sem alterações em `BaseAgent`, `chat_service.py`, schemas ou endpoints.

---

## Contexto: Como funciona o MCP aqui

```
AnswerAgent
  └── tools property
        └── TOOLS (registry.py)
              ├── echo  (existente)
              └── [list_events, get_event, ...]  ← vindos do MCP Server

MCP Server (processo Node.js local)
  └── @modelcontextprotocol/server-google-calendar
        └── OAuth2 → Google Calendar API
```

O `langchain-mcp-adapters` conecta ao processo MCP via stdio e expõe as tools como `BaseTool` do LangChain — sem mudança na interface do `BaseAgent`.

---

## Pré-requisitos de Setup (fora do código)

### 1. MCP Server instalado globalmente

```bash
npm install -g @modelcontextprotocol/server-google-calendar
```

### 2. Credenciais OAuth2 no Google Cloud

1. Acessar [Google Cloud Console](https://console.cloud.google.com/)
2. Criar um projeto (ou usar existente)
3. Habilitar **Google Calendar API**
4. Criar credenciais **OAuth 2.0** do tipo *Desktop App*
5. Baixar o arquivo `credentials.json`
6. Executar o fluxo de autenticação uma vez para gerar `token.json`:
   ```bash
   npx @modelcontextprotocol/server-google-calendar --credentials /path/to/credentials.json
   ```
7. Salvar os caminhos de `credentials.json` e `token.json` como variáveis de ambiente (ver abaixo)

---

## Variáveis de Ambiente

Adicionar ao `.env` e ao `appconfig.py`:

```
GOOGLE_CALENDAR_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_CALENDAR_TOKEN_PATH=/path/to/token.json
```

---

## Directory Changes

```
app/
  tools/
    registry.py                    # UPDATED — inclui tools do Calendar
    google_calendar.py             # NEW — factory assíncrona MCP
  agents/
    answer_node/
      prompts/
        system.py                  # UPDATED — instrui sobre uso do calendário
appconfig.py                       # UPDATED — novas env vars
pyproject.toml                     # UPDATED — langchain-mcp-adapters
tests/
  unit/
    test_google_calendar_tools.py  # NEW — testa a factory de tools
```

---

## Implementação

### `pyproject.toml`

Adicionar à lista de `dependencies`:

```toml
"langchain-mcp-adapters>=0.1.0",
```

### `appconfig.py`

Adicionar após as variáveis existentes:

```python
GOOGLE_CALENDAR_CREDENTIALS_PATH: str = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_PATH", "")
GOOGLE_CALENDAR_TOKEN_PATH: str = os.getenv("GOOGLE_CALENDAR_TOKEN_PATH", "")
```

### `app/tools/google_calendar.py` (novo)

```python
from langchain_mcp_adapters.client import MultiServerMCPClient
import appconfig


async def get_google_calendar_tools() -> list:
    """
    Connects to the Google Calendar MCP Server via stdio and returns
    the available tools as LangChain BaseTool instances.

    Raises RuntimeError if credentials are not configured.
    """
    if not appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH:
        raise RuntimeError(
            "GOOGLE_CALENDAR_CREDENTIALS_PATH is not set. "
            "Configure credentials before loading Google Calendar tools."
        )

    client = MultiServerMCPClient(
        {
            "google-calendar": {
                "command": "npx",
                "args": [
                    "-y",
                    "@modelcontextprotocol/server-google-calendar",
                    "--credentials",
                    appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH,
                    "--token",
                    appconfig.GOOGLE_CALENDAR_TOKEN_PATH,
                ],
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()
```

### `app/tools/registry.py` (atualizado)

```python
import asyncio
import logging

from langchain_core.tools import tool

from app.tools.google_calendar import get_google_calendar_tools

logger = logging.getLogger(__name__)


@tool
async def echo(text: str) -> str:
    """Echoes the input text back. Used for testing tool execution."""
    return text


def _load_tools() -> list:
    """
    Loads all tools — built-in and MCP-sourced.
    Falls back gracefully if MCP tools fail to load (e.g., missing credentials).
    """
    base_tools = [echo]

    try:
        calendar_tools = asyncio.get_event_loop().run_until_complete(
            get_google_calendar_tools()
        )
        return base_tools + calendar_tools
    except Exception as exc:
        logger.warning("Google Calendar MCP tools not loaded: %s", exc)
        return base_tools


TOOLS = _load_tools()
```

### `app/agents/answer_node/prompts/system.py` (atualizado)

```python
SYSTEM_PROMPT = (
    "You are a helpful personal assistant. "
    "Answer the user's questions clearly and concisely. "
    "When you have access to tools, use them when appropriate. "
    "You have access to the user's Google Calendar. "
    "When the user asks about appointments, meetings, events, or their schedule, "
    "use the calendar tools to fetch real data before answering. "
    "Always present dates and times in a friendly, human-readable format."
)
```

---

## Testes

### `tests/unit/test_google_calendar_tools.py` (novo)

**Scenario 1 — raises RuntimeError when credentials not set:**
- Patch `appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH = ""`.
- Assert `await get_google_calendar_tools()` raises `RuntimeError`.

**Scenario 2 — calls MultiServerMCPClient with correct config:**
- Patch `appconfig.GOOGLE_CALENDAR_CREDENTIALS_PATH = "/fake/credentials.json"`.
- Patch `appconfig.GOOGLE_CALENDAR_TOKEN_PATH = "/fake/token.json"`.
- Mock `MultiServerMCPClient` and its `get_tools()` to return `[MagicMock()]`.
- Assert `MultiServerMCPClient` was called with the expected server config dict.
- Assert return value matches the mocked tools list.

**Scenario 3 — registry falls back to base tools when MCP fails:**
- Mock `get_google_calendar_tools` to raise `RuntimeError`.
- Re-import `_load_tools` from `app.tools.registry`.
- Assert returned list contains only `echo`.

---

## Exemplo de uso

```
Usuário: Quais são meus compromissos de amanhã?

Assistente: [invoca list_events(date="2026-03-05")]
            Você tem 2 compromissos amanhã:
            - 09:00 — Daily do time de produto
            - 14:30 — Revisão de sprint com o cliente XYZ
```

---

## Acceptance Criteria

- [ ] `langchain-mcp-adapters` listado em `pyproject.toml`.
- [ ] `GOOGLE_CALENDAR_CREDENTIALS_PATH` e `GOOGLE_CALENDAR_TOKEN_PATH` lidos via `appconfig`.
- [ ] `get_google_calendar_tools()` levanta `RuntimeError` quando credenciais ausentes.
- [ ] `TOOLS` em `registry.py` inclui tools do Calendar quando credenciais configuradas.
- [ ] `TOOLS` cai para `[echo]` quando MCP falha (graceful fallback).
- [ ] System prompt do `AnswerAgent` instrui sobre uso do calendário.
- [ ] `pytest` passa todos os testes (incluindo os 3 novos).
- [ ] `ruff check .` e `black --check .` saem limpos.

---

## Out of Scope

- Criar ou editar eventos (apenas leitura nesta spec).
- Autenticação automática OAuth (fluxo manual pré-requisito).
- Suporte a múltiplos calendários ou múltiplos usuários.
- Cache de tools entre requests.
- Criar um agente separado para o Calendar (integração direta no `AnswerAgent`).
