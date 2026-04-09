# spec-0004-conversation-memory

**Status:** done
**Version:** v1.0

## Objective

Integrate the `session_start` SSE event emitted by the API so that the frontend captures and persists a `conversation_id` across messages in the same chat session, enabling the agent to maintain conversational context.

## Context

The API now emits `session_start` as the first event in every SSE stream (see `docs/specs/frontend-conversation-memory.txt`). This event carries a `conversation_id` UUID that must be sent back on every subsequent request within the same session. When the user starts a new chat, `conversation_id` must be reset to `null`.

The existing implementation in `spec-0002` already has:
- `conversationId: string | null` field in `useChatStore`
- `setConversationId` action in `useChatStore`
- `chatService.ts` already sends `conversation_id` in the request body
- `resetChat` in `useChatStore` already clears `conversationId`

Only the SSE parser and the type system need to be updated.

## Requirements

### 1. Type System

1.1. The `ChatEvent` union in `src/types/chat.ts` **must** be extended with a new variant:

```ts
| { type: 'session_start'; conversation_id: string }
```

1.2. No other types **must** change.

---

### 2. SSE Parser (`src/services/chatService.ts`)

2.1. The `streamChat` generator **must** yield `session_start` events like any other event — no special handling inside the service.

2.2. The service requires no other changes (it already yields all parsed events generically).

---

### 3. Streaming Hook (`src/hooks/useChatStream.ts`)

3.1. When a `session_start` event is received, the hook **must** call `setConversationId(event.conversation_id)`.

3.2. The `session_start` event **must NOT** add any message to the message list — it is metadata only.

3.3. On the first message of a new conversation, `conversationId` is already `null` in the store — no extra reset is needed inside the hook.

---

### 4. Store — no changes required

4.1. `useChatStore` already exposes `conversationId` and `setConversationId`. No changes required.

4.2. `resetChat` already sets `conversationId` to `null`. "New Chat" behavior is already correct.

---

### 5. Testing

5.1. `useChatStream.test.ts` **must** add a test case that verifies:
  - When a `session_start` event is emitted, `setConversationId` is called with the received UUID.
  - No extra message is appended to the store when `session_start` arrives.

5.2. The `ChatEvent` type test (if any static type test exists) **must** be updated to include `session_start`.

---

## Out of Scope

- Displaying conversation history across page reloads (requires backend persistence).
- Showing the `conversation_id` in the UI.
- Managing multiple simultaneous conversations.
- Expiring or invalidating `conversation_id` on the frontend.

## Dependencies

- `spec-0002-chat-ui.md` — must be `done`.

## Acceptance Criteria

- [ ] `src/types/chat.ts` includes `session_start` in the `ChatEvent` union.
- [ ] Sending a second message in the same session includes the `conversation_id` received from the first `session_start` event.
- [ ] Clicking "New Chat" clears `conversation_id` (already covered by `resetChat` — verify with test).
- [ ] `session_start` event produces no visible message in the chat UI.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` passes all tests including the new `session_start` case.
