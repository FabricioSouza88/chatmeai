# Chart Skill — Backend Spec

## Contexto

Adição de uma skill de geração de gráficos ao agente LangGraph existente.
O agente já possui um grafo com nodes próprios. Esta spec descreve apenas os artefatos novos e as modificações necessárias para integrar a chart skill sem quebrar o que existe.

---

## Objetivo

Receber um `user_input` (string), `context` (string) e um `dataset` (lista de dicionários) e retornar um `ChartSpec` JSON canônico, agnóstico de biblioteca de renderização.

O LLM não busca dados. Ele apenas analisa o dataset recebido e decide a melhor visualização para responder à intenção do usuário.

O novo node deve ser incorporado ao gravo e invocado como uma tool, se o agente orquestrador entender que isso é necessário com base na pergunta do usuário.

---

## Estrutura de arquivos

Criar dentro do pacote do agente existente:

```
agent/
└── skills/
    └── chart/
        ├── __init__.py
        ├── schema.py        # ChartSpec e modelos auxiliares
        ├── node.py          # chart_node e lógica de validação
        ├── prompts.py       # system prompt e templates
        └── tests/
            ├── __init__.py
            ├── test_schema.py
            └── test_node.py
```

---

## schema.py

### Modelos

```python
class ChartType(str, Enum):
    bar             = "bar"
    bar_horizontal  = "bar_horizontal"
    line            = "line"
    area            = "area"
    pie             = "pie"
    donut           = "donut"
    scatter         = "scatter"
    heatmap         = "heatmap"
    histogram       = "histogram"

class SortOrder(str, Enum):
    asc  = "asc"
    desc = "desc"
    none = "none"

class Axis(BaseModel):
    key: str
    label: str
    format: str | None = None
    # Valores válidos de format:
    # "integer", "float", "percent", "currency_brl",
    # "currency_usd", "date:DD/MM/YYYY", "date:MM/YYYY"

class Series(BaseModel):
    key: str
    label: str
    color: str | None = None  # hex, ex: "#378ADD"

class ChartSpec(BaseModel):
    chart_type:        ChartType
    title:             str
    subtitle:          str | None       = None
    data:              list[dict[str, Any]]
    x:                 Axis | None      = None  # None para pie/donut
    y:                 Axis | None      = None
    series:            list[Series]
    sort:              SortOrder        = SortOrder.none
    stacked:           bool             = False
    show_legend:       bool             = True
    show_data_labels:  bool             = False
    summary:           str
    reasoning:         str
```

### Restrições de validação (implementar com `@model_validator`)

- `pie` e `donut`: `x` deve ser `None`; `series` deve ter exatamente 1 item.
- `scatter`: `x` e `y` obrigatórios; `series` deve ter pelo menos 1 item.
- `bar`, `line`, `area`, `bar_horizontal`, `histogram`: `x` obrigatório.
- `series` nunca pode ser lista vazia para nenhum tipo.
- `stacked=True` só é válido para `bar`, `bar_horizontal` e `area`.

---

## prompts.py

### System prompt

Deve instruir o LLM a:

1. Escolher o `chart_type` pela **intenção** do usuário, seguindo esta heurística:
   - Comparação entre categorias → `bar`
   - Evolução temporal → `line` ou `area`
   - Proporção (até 6 categorias) → `pie` ou `donut`
   - Correlação entre duas variáveis numéricas → `scatter`
   - Distribuição de frequência → `histogram`
   - Comparação horizontal com labels longos → `bar_horizontal`

2. Usar **apenas** colunas presentes no dataset. Nunca inferir ou inventar valores.

3. Preencher o campo `data` com os dados normalizados prontos para renderização, sem transformações adicionais.

4. Preencher `summary` com uma frase completa descrevendo o insight principal do gráfico.

5. Preencher `reasoning` explicando por que aquele `chart_type` foi escolhido.

6. Para múltiplas séries numéricas, criar um item em `series` por coluna.

### Template de mensagem do usuário

```
Pergunta: {user_input}

Schema do dataset:
- Colunas: {columns}
- Tipos: {types}
- Total de linhas: {total_rows}
- Amostra (primeiras 3 linhas): {sample}

Dataset completo:
{full_data}
```

---

## node.py

### Função `describe_dataset`

Recebe `list[dict]` e retorna um dicionário com:
- `columns`: lista de nomes das colunas
- `types`: dicionário `{coluna: tipo_python}`
- `total_rows`: int
- `sample`: lista com as 3 primeiras linhas

Usar `default=str` na serialização JSON para suportar `datetime`, `Decimal` e outros tipos não serializáveis nativamente.

### Função `validate_column_refs`

Recebe `ChartSpec` e `set[str]` (colunas disponíveis no dataset).
Retorna `set[str]` com colunas referenciadas no spec que não existem no dataset.

Colunas a checar: `x.key` (se existir), `y.key` (se existir), todos os `series[*].key`.

### Função `chart_node`

Assinatura: `def chart_node(state: AgentState) -> AgentState`

Lê do state: `state["user_input"]`, `state["dataset"]`
Escreve no state: `state["chart_spec"]`, `state["error"]`

Fluxo interno:

```
1. Validar dataset não vazio → retornar error se vazio
2. Chamar describe_dataset
3. Montar user_message com o template de prompts.py
4. Chamar LLM via with_structured_output(ChartSpec)
5. Chamar validate_column_refs
6. Se houver colunas inválidas → retornar error com detalhe
7. Retornar state com chart_spec preenchido e error=None
```

Erros devem ser strings descritivas em português.
Não relançar exceções — capturar e retornar em `state["error"]`.

### Integração com AgentState

Adicionar ao `AgentState` existente (TypedDict):

```python
dataset:    list[dict[str, Any]]    # entrada
chart_spec: ChartSpec | None        # saída
error:      str | None              # saída
```

Se o projeto usar classes de state customizadas, adaptar conforme o padrão já adotado.

### Instância do LLM

Usar o mesmo cliente LLM já configurado no projeto, se existir.
Caso contrário, instanciar `ChatAnthropic(model="claude-sonnet-4-20250514")` em `node.py`.
Não criar novas instâncias por chamada — instanciar no módulo.

---

## Integração ao grafo existente

Adicionar o node ao grafo existente. Não recriar o grafo.

```python
graph.add_node("chart", chart_node)
```

O roteamento para este node é responsabilidade do `router_node` já existente.
A lógica de roteamento está fora do escopo desta spec.

---

## Testes

### test_schema.py

Cobrir com `pytest`:

- `ChartSpec` válido para cada `chart_type`
- `pie`/`donut` com `x != None` deve falhar na validação
- `pie`/`donut` com `series` vazia deve falhar
- `scatter` sem `x` ou `y` deve falhar
- `stacked=True` em `pie` deve falhar
- `series` vazia deve falhar para qualquer tipo

### test_node.py

Cobrir com `pytest` + `unittest.mock`:

- Dataset vazio → `error` preenchido, `chart_spec` é `None`
- LLM retorna spec com coluna inexistente → `error` preenchido
- LLM retorna spec válido → `chart_spec` preenchido, `error` é `None`
- `describe_dataset` com tipos não serializáveis (`datetime`, `Decimal`) não lança exceção

Mockar a chamada ao LLM em todos os testes de `test_node.py`.

---

## O que está fora do escopo desta spec

- Busca de dados (query ao banco, chamada a API)
- Roteamento para o chart_node
- Frontend / adapter de renderização
- Autenticação e autorização
- Cache de respostas