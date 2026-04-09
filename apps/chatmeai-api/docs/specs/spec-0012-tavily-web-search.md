# spec-0012 — Tavily Web Search Tool

**Status:** done
**Version:** v1.0

---

## Objective

Adicionar suporte a busca na web ao agente usando a ferramenta `TavilySearchResults` do LangChain, carregada via `TAVILY_API_KEY` e registrada no registry de tools existente.

---

## Context

O agente atual (spec-0006) possui tools de calendário, tempo e hora. Perguntas que requerem informações atualizadas da internet (notícias, preços, eventos recentes) não podem ser respondidas. A integração com Tavily via `langchain-community` permite que o agente realize buscas na web de forma nativa ao fluxo LangGraph existente, sem necessidade de MCP.

---

## Requirements

1. O sistema **must** carregar a `TavilySearchResults` tool se `TAVILY_API_KEY` estiver configurada no ambiente.
2. A variável `TAVILY_API_KEY` **must** ser lida via `appconfig.py` usando `os.getenv`.
3. A tool **must** ser registrada na lista `TOOLS` do `app/tools/registry.py`, seguindo o mesmo padrão das tools existentes.
4. O carregamento **must** ser feito de forma síncrona (diferente das tools MCP), pois `TavilySearchResults` é uma tool LangChain padrão instanciada diretamente.
5. Se `TAVILY_API_KEY` não estiver configurada, o sistema **must** ignorar silenciosamente e registrar um aviso via `logger.warning`.
6. O número máximo de resultados retornados pela busca **should** ser configurável via `TAVILY_MAX_RESULTS` (padrão: `3`).
7. O sistema **must** criar o arquivo `app/tools/web_search.py` contendo a função `get_web_search_tool()` que retorna a instância da tool.

---

## Out of scope

- Suporte a outros provedores de busca (SerpAPI, Bing, DuckDuckGo).
- Interface de usuário para exibir fontes/URLs dos resultados.
- Rate limiting ou cache de resultados de busca.
- Busca configurável por idioma ou região.

---

## Dependencies

- spec-0006-base-agent.md (done)

---

## Acceptance criteria

1. Com `TAVILY_API_KEY` configurada, `TOOLS` inclui a `TavilySearchResults` tool após a inicialização.
2. Sem `TAVILY_API_KEY`, a aplicação inicia normalmente e registra `logger.warning` sobre a tool não carregada.
3. O agente consegue responder perguntas sobre eventos recentes fazendo uso da tool de busca.
4. `pytest` passa todos os testes existentes sem regressões.
5. `ruff check .` e `black --check .` retornam sem erros.

---

## Implementation plan

### 1. Atualizar `appconfig.py`

Adicionar as novas variáveis de ambiente:

```python
# Tavily Web Search
TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
TAVILY_MAX_RESULTS: int = int(os.getenv("TAVILY_MAX_RESULTS", "3"))
```

### 2. Novo arquivo: `app/tools/web_search.py`

```python
from langchain_community.tools.tavily_search import TavilySearchResults
import appconfig


def get_web_search_tool() -> TavilySearchResults:
    return TavilySearchResults(
        max_results=appconfig.TAVILY_MAX_RESULTS,
        api_key=appconfig.TAVILY_API_KEY,
    )
```

### 3. Atualizar `app/tools/registry.py`

Carregar a tool de busca de forma síncrona no bloco de inicialização, antes de `load_mcp_tools()`:

```python
import appconfig
from app.tools.web_search import get_web_search_tool

if appconfig.TAVILY_API_KEY:
    try:
        TOOLS.append(get_web_search_tool())
        logger.info("Tavily web search tool loaded")
    except Exception as exc:
        logger.warning("Tavily web search tool not loaded: %s", exc)
else:
    logger.warning("TAVILY_API_KEY not set — web search tool disabled")
```

### 4. Instalar dependência

```
pip install langchain-community tavily-python
```

Adicionar ao `requirements.txt` ou `pyproject.toml`:
```
langchain-community
tavily-python
```

---

## Directory changes

```
app/
  tools/
    web_search.py    # NEW — get_web_search_tool()
    registry.py      # UPDATED — carrega Tavily tool se TAVILY_API_KEY presente
appconfig.py         # UPDATED — TAVILY_API_KEY, TAVILY_MAX_RESULTS
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TAVILY_API_KEY` | No | `""` | Chave da API Tavily. Tool desabilitada se vazia. |
| `TAVILY_MAX_RESULTS` | No | `3` | Número máximo de resultados por busca. |
