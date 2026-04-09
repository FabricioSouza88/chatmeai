# spec-0011 — Conversation Name

**Status:** done
**Version:** v1.0

---

## Objective

Adicionar um nome/título a cada janela de conversa, gerado automaticamente da primeira mensagem do usuário, persistido no SQLite e retornado tanto no evento `session_start` quanto no endpoint `GET /conversations`.

---

## Context

Atualmente cada conversa é identificada apenas por um UUID. A interface do usuário não tem como exibir um título descritivo para cada conversa na lista ou na aba atual.

---

## Requirements

1. O sistema **must** gerar automaticamente um nome para cada nova conversa com base na primeira mensagem do usuário (truncada em 60 caracteres).
2. O nome **must** ser persistido em uma tabela `conversation_names` no mesmo banco SQLite usado pelo LangGraph.
3. O evento SSE `session_start` **must** incluir o campo `name` com o nome da conversa.
4. O endpoint `GET /conversations` **must** retornar o campo `name` em cada `ConversationSummary`.
5. Para conversas existentes (com `conversation_id` fornecido pelo cliente), o sistema **must** retornar o nome já persistido.
6. Se não houver nome persistido (conversa antiga), o sistema **must** usar os primeiros caracteres da mensagem atual como fallback.

---

## Out of scope

- Nome editável manualmente pelo usuário.
- Nome gerado por LLM (resumo semântico).
- Suporte a truncamento por palavra/frase completa.

---

## Dependencies

- spec-0008-conversation-memory.md (done)
- spec-0009-list-conversations.md (done)

---

## Acceptance criteria

1. Nova conversa: `session_start` inclui `name` com os primeiros 60 chars da mensagem (sufixo `…` se truncado).
2. Conversa continuada: `session_start` retorna o nome original persistido, não o da nova mensagem.
3. `GET /conversations` retorna `name` para cada conversa.
4. O nome persiste entre reinicializações do servidor.

---

## Implementation plan

### 1. Nova tabela: `conversation_names`

Criada automaticamente durante `init_checkpointer()` no mesmo banco SQLite:

```sql
CREATE TABLE IF NOT EXISTS conversation_names (
    thread_id TEXT PRIMARY KEY,
    name      TEXT NOT NULL
);
```

### 2. Novo arquivo: `app/db/conversations.py`

Funções para persistir e buscar nomes de conversas via aiosqlite.

### 3. Atualizar `app/db/checkpointer.py`

Chamar `init_conversation_names_table(conn)` ao final de `init_checkpointer()`.

### 4. Atualizar `app/schemas/chat.py`

Adicionar campo `name: str` ao `SessionStartEvent`.

### 5. Atualizar `app/schemas/conversation.py`

Adicionar campo `name: str` ao `ConversationSummary`.

### 6. Atualizar `app/services/chat_service.py`

Em `stream_chat`:
- Se nova conversa: gerar nome, persistir, incluir no `session_start`.
- Se existente: buscar nome persistido (fallback: primeiros chars da mensagem atual), incluir no `session_start`.

### 7. Atualizar `app/api/v1/endpoints/conversations.py`

LEFT JOIN com `conversation_names` para incluir `name` na listagem (fallback ao `thread_id` se não houver nome).

---

## Directory changes

```
app/
  db/
    checkpointer.py        # UPDATED — cria tabela conversation_names no init
    conversations.py       # NEW — set/get conversation name
  schemas/
    chat.py                # UPDATED — name em SessionStartEvent
    conversation.py        # UPDATED — name em ConversationSummary
  services/
    chat_service.py        # UPDATED — persiste e retorna nome
  api/v1/endpoints/
    conversations.py       # UPDATED — retorna name na listagem
```

---

## SSE event flow example

```
Usuário (nova conversa): "Quais são meus compromissos amanhã?"

data: {"type":"session_start","conversation_id":"...","name":"Quais são meus compromissos amanhã?"}
data: {"type":"thinking"}
...
data: {"type":"done","finish_reason":"stop"}

GET /api/v1/conversations →
[
  {
    "conversation_id": "...",
    "name": "Quais são meus compromissos amanhã?",
    "created_at": "...",
    "updated_at": "..."
  }
]
```
