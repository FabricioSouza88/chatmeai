# spec-0010 — MCP Open-Meteo Weather Tool

**Status:** done
**Version:** v1.0

---

## Objective

Integrar previsão do tempo ao `AnswerAgent` via MCP usando a API **Open-Meteo**, permitindo que o assistente consulte condições climáticas atuais e previsões em linguagem natural, sem necessidade de chave de API.

---

## Context

O `AnswerAgent` atualmente só possui `echo` e Google Calendar como tools. Perguntas sobre clima ("Como está o tempo em São Paulo?", "Vai chover amanhã no Rio?") não são respondidas com dados reais.

**Por que Open-Meteo:**
- Gratuito, sem necessidade de API key ou cadastro.
- Cobertura global com dados de múltiplos modelos meteorológicos (ECMWF, GFS, etc.).
- Alta disponibilidade (SLA robusto, amplamente usado em produção).
- MCP server disponível como pacote npm (`@timlukahorstmann/mcp-weather`), que internamente usa Open-Meteo API.
- Mesma pattern `npx -y` já usada pelo Google Calendar MCP.

O padrão de integração é idêntico ao da spec-0007: factory assíncrona + `MultiServerMCPClient` stdio + fallback gracioso no registry.

---

## Requirements

1. O sistema **must** carregar as tools de clima via `MultiServerMCPClient` usando o MCP server `@timlukahorstmann/mcp-weather`.
2. A tool **must** aceitar o nome da cidade ou coordenadas geográficas como entrada.
3. Caso o MCP server falhe ao carregar (ex: Node.js não disponível), o sistema **must** continuar operando com as demais tools via fallback gracioso — sem crash.
4. Nenhuma variável de ambiente ou API key **must** ser exigida para o funcionamento básico.
5. O system prompt do `AnswerAgent` **must** ser atualizado para instruir o modelo a usar a tool de clima quando relevante.
6. A tool **must** ser carregada no startup junto às demais tools existentes.

---

## Out of scope

- Caching de resultados de clima.
- Alertas ou notificações proativas de clima.
- Integração com múltiplos providers de clima.
- Histórico climático.

---

## Dependencies

- spec-0006-base-agent.md (done)
- spec-0007-mcp-google-calendar.md (done) — padrão a seguir

---

## Acceptance criteria

1. Pergunta "Como está o tempo em São Paulo agora?" resulta em resposta com dados reais de temperatura e condição climática.
2. Pergunta "Vai chover amanhã em Lisboa?" retorna previsão com probabilidade de chuva.
3. Se Node.js não estiver disponível, o servidor inicia normalmente sem as tools de clima (warning no log, sem exception).
4. `TOOLS` em `registry.py` inclui as tools de clima quando o MCP carrega com sucesso.

---

## Implementation plan

### 1. Pré-requisito de setup (fora do código)

Node.js deve estar instalado no ambiente. O servidor MCP é instalado automaticamente via `npx -y` na primeira execução.

Verificar disponibilidade:
```bash
node --version   # >= 18
npx -y @timlukahorstmann/mcp-weather --help
```

### 2. Novo arquivo: `app/tools/weather.py`

```python
from langchain_mcp_adapters.client import MultiServerMCPClient


async def get_weather_tools() -> list:
    """
    Connects to the Open-Meteo MCP server (@timlukahorstmann/mcp-weather)
    via stdio and returns the available tools as LangChain BaseTool instances.

    No API key or credentials required — Open-Meteo is free and public.
    """
    client = MultiServerMCPClient(
        {
            "weather": {
                "command": "npx",
                "args": ["-y", "@timlukahorstmann/mcp-weather"],
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()
```

### 3. Atualizar `app/tools/registry.py`

Importar `get_weather_tools` e adicioná-la ao `_load_tools` com fallback:

```python
try:
    weather_tools = asyncio.get_event_loop().run_until_complete(get_weather_tools())
    base_tools += weather_tools
except Exception as exc:
    logger.warning("Weather MCP tools not loaded: %s", exc)
```

### 4. Atualizar `app/agents/answer_node/prompts/system.py`

Adicionar instrução sobre uso do clima:

```
"You have access to real-time weather data. When the user asks about current weather,
forecasts, temperature, rain, or climate conditions for any location, use the weather
tool to fetch accurate data before answering. Always include the location and time
reference in your answer."
```

### 5. Sem alterações em `appconfig.py`, `pyproject.toml`, schemas ou endpoints.

---

## Directory changes

```
app/
  tools/
    registry.py          # UPDATED — carrega weather tools com fallback
    weather.py           # NEW — factory assíncrona MCP Open-Meteo
  agents/
    answer_node/
      prompts/
        system.py        # UPDATED — instrução sobre uso do clima
```

---

## SSE event flow example

```
Usuário: "Como está o tempo em São Paulo?"

data: {"type":"session_start","conversation_id":"..."}
data: {"type":"thinking"}
data: {"type":"tool_call","tool_name":"get_current_weather","arguments":{"location":"São Paulo"}}
data: {"type":"tool_result","tool_name":"get_current_weather","result":"28°C, partly cloudy..."}
data: {"type":"content_delta","delta":"Agora em São Paulo está 28°C com..."}
data: {"type":"done","finish_reason":"stop"}
```
