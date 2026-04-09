# spec-0002-chat-ui

**Status:** done
**Version:** v1.0

## Objective

Implement a modern, production-ready chat interface inspired by ChatGPT: left sidebar navigation, streaming assistant responses, tool call display, Markdown rendering, and a first-class theme system (light, dark, custom, disableable).

## Context

The backend exposes a single SSE endpoint (`POST /api/v1/chat`) that streams typed events (`thinking`, `content_delta`, `tool_call`, `tool_result`, `done`, `error`). The full contract is in `docs/specs/chat-api-contract.txt`. The frontend must consume this stream token-by-token and render assistant messages progressively. The application is chat-first but must support future screens through a persistent left sidebar shell.

## Requirements

---

### 1. Application Shell

1.1. The layout **must** consist of two regions: a collapsible **left sidebar** and a **main content area**, rendered inside a full-viewport root element.

1.2. The sidebar **must** be visible by default on desktop (≥768 px) and collapsed (off-canvas) by default on mobile.

1.3. A toggle button **must** allow the user to open and close the sidebar on both breakpoints.

1.4. The sidebar and main content area **must** react to theme changes without a full page reload.

---

### 2. Sidebar

2.1. The sidebar **must** contain, from top to bottom:
  - A **"New Chat"** button that resets the chat to an empty state.
  - A **conversations list** area (placeholder — list is empty; no history persistence in this spec).
  - A **footer zone** with: theme selector, and a settings placeholder icon.

2.2. The sidebar **must** be 260 px wide on desktop and slide over the content on mobile (overlay mode).

2.3. The sidebar background **must** use the `surface-sidebar` design token (see §4).

---

### 3. Chat Page

3.1. The chat page **must** be the default route rendered in the main content area.

3.2. The page **must** have three vertical sections:
  - **Message list** — scrollable, grows to fill available space.
  - **Input bar** — pinned to the bottom of the page.
  - **Empty state** — shown when there are no messages; centered, with the app name and a subtitle.

3.3. The message list **must** auto-scroll to the latest message as new tokens arrive.

3.4. Auto-scroll **must** be suspended if the user scrolls up manually, and resume when the user scrolls back to the bottom.

---

### 4. Theme System

4.1. The theme system **must** be implemented with **CSS custom properties** scoped to a `data-theme` attribute on the `<html>` element (e.g., `<html data-theme="dark">`).

4.2. The following **design tokens** (CSS variables) **must** be defined for every theme:

| Token | Purpose |
|---|---|
| `--color-bg` | Page background |
| `--color-surface` | Card / message bubble surface |
| `--color-surface-sidebar` | Sidebar background |
| `--color-border` | Dividers and borders |
| `--color-text-primary` | Primary text |
| `--color-text-secondary` | Muted / secondary text |
| `--color-accent` | Brand accent (buttons, links) |
| `--color-accent-hover` | Accent hover state |
| `--color-user-bubble` | User message bubble background |
| `--color-assistant-bubble` | Assistant message bubble background |
| `--color-input-bg` | Chat input background |
| `--color-code-bg` | Inline and block code background |

4.3. **Two built-in themes must be provided:** `light` and `dark`.

4.4. The theme system **must** support adding custom themes by registering a new `data-theme` CSS block — no JavaScript changes required for new themes.

4.5. Individual themes **must** be disableable by removing their CSS block, falling back to the default (`dark`).

4.6. The active theme **must** be persisted in `localStorage` under the key `chatme-theme`.

4.7. On first visit, if `localStorage` has no stored theme, the system **must** detect `prefers-color-scheme` and apply `dark` or `light` accordingly.

4.8. A `useTheme` hook **must** be created at `src/hooks/useTheme.ts`, exposing:
  - `theme: string` — current active theme key.
  - `setTheme(key: string): void` — applies and persists a theme.
  - `themes: string[]` — list of registered/available themes.

4.9. A `ThemeSelector` component **must** be placed in the sidebar footer, rendering the available themes as selectable options.

---

### 5. Message Types and Rendering

5.1. The following message roles **must** be supported: `user`, `assistant`, `tool_call`, `tool_result`.

5.2. **User messages** **must** render as right-aligned (or visually distinct) bubbles with the user's plain text.

5.3. **Assistant messages** **must** render Markdown using `react-markdown` + `remark-gfm`, including:
  - Paragraphs, bold, italic, lists, blockquotes.
  - Fenced code blocks with syntax highlighting (via `react-syntax-highlighter` or `shiki`).
  - Inline code.

5.4. A **thinking indicator** **must** be shown while the assistant is in the `thinking` state (animated dots or pulse).

5.5. **Tool call** events **must** render a collapsed card showing `tool_name` and a toggle to expand the raw `arguments` JSON.

5.6. **Tool result** events **must** render adjacent to their tool call card, showing `tool_name` and `result`.

5.7. A **streaming cursor** (blinking `|`) **must** be appended to the assistant message while `content_delta` events are being received.

5.8. When the `done` event is received, the cursor **must** disappear and the final message **must** be fully rendered.

5.9. When an `error` event is received, an inline error message **must** be displayed in place of the assistant response.

---

### 6. Chat Input

6.1. The input **must** be a `<textarea>` that auto-resizes vertically (min 1 row, max 6 rows).

6.2. Pressing **Enter** (without Shift) **must** submit the message. **Shift+Enter** **must** insert a newline.

6.3. The input **must** be disabled while a streaming response is in progress.

6.4. A **Send** button **must** be rendered to the right of the input, disabled when the input is empty or a request is in flight.

6.5. A **Stop** button **must** replace the Send button during streaming, allowing the user to abort the current request.

6.6. The input **must** be focused automatically when the page loads and after each response completes.

---

### 7. API Integration — SSE Streaming

7.1. A service function `src/services/chatService.ts` **must** export `streamChat`, which:
  - Accepts `{ message: string; conversationId?: string }`.
  - Sends a `POST` to `VITE_API_BASE_URL + /api/v1/chat` with `Content-Type: application/json`.
  - Reads the response body as a `ReadableStream`.
  - Parses each `data: <JSON>` line and yields typed `ChatEvent` objects via an `AsyncGenerator`.

7.2. The function **must** support cancellation via `AbortSignal`.

7.3. Malformed SSE lines (non-`data:` prefixed, empty lines) **must** be silently skipped.

7.4. A custom hook `src/hooks/useChatStream.ts` **must** encapsulate the streaming lifecycle:
  - Appends the user message to the store immediately (optimistic).
  - Streams `content_delta` tokens into a growing assistant message.
  - Handles `thinking`, `tool_call`, `tool_result`, `done`, and `error` events.
  - Exposes `{ isStreaming, send, stop }`.

---

### 8. State Management

8.1. `src/store/useChatStore.ts` **must** be updated to manage:

| State field | Type | Description |
|---|---|---|
| `messages` | `Message[]` | All messages in the current conversation |
| `isStreaming` | `boolean` | Whether a stream is active |
| `conversationId` | `string \| null` | Current conversation ID |

8.2. Actions **must** include: `addMessage`, `appendDelta`, `setStreaming`, `resetChat`, `setConversationId`.

8.3. `src/store/useThemeStore.ts` **must** manage `theme` state and sync with `localStorage` and the DOM attribute.

---

### 9. TypeScript Types

9.1. All event types from the API contract **must** be modeled in `src/types/chat.ts`:

```ts
type ChatEventType = 'thinking' | 'content_delta' | 'tool_call' | 'tool_result' | 'done' | 'error'

type ChatEvent =
  | { type: 'thinking' }
  | { type: 'content_delta'; delta: string }
  | { type: 'tool_call'; tool_name: string; arguments: Record<string, unknown> }
  | { type: 'tool_result'; tool_name: string; result: string }
  | { type: 'done'; finish_reason: string }
  | { type: 'error'; message: string }
```

9.2. Message roles and the `Message` type **must** be defined in `src/types/chat.ts`.

9.3. No `any` types are permitted. Use `unknown` where the shape cannot be statically known.

---

### 10. Component Structure

The following components **must** be created under `src/components/`:

| Component | Responsibility |
|---|---|
| `Layout/AppShell.tsx` | Root layout: sidebar + main content slot |
| `Layout/Sidebar.tsx` | Sidebar with nav, new chat, footer |
| `Layout/SidebarToggle.tsx` | Toggle button (hamburger / close icon) |
| `Chat/ChatPage.tsx` | Top-level chat screen (placed in `src/pages/`) |
| `Chat/MessageList.tsx` | Scrollable list of messages |
| `Chat/MessageBubble.tsx` | Single message renderer (user/assistant/tool) |
| `Chat/MarkdownRenderer.tsx` | Markdown + code highlight wrapper |
| `Chat/ToolCallCard.tsx` | Collapsible tool call + result card |
| `Chat/ThinkingIndicator.tsx` | Animated "thinking" state |
| `Chat/ChatInput.tsx` | Textarea + send/stop controls |
| `Theme/ThemeSelector.tsx` | Theme picker (dropdown or icon group) |

---

### 11. Routing

11.1. `react-router-dom` (v6+) **must** be installed and configured in `src/main.tsx`.

11.2. The initial route (`/`) **must** render `ChatPage` inside `AppShell`.

11.3. A wildcard `*` route **must** redirect to `/`.

11.4. The router **must** use `createBrowserRouter`.

---

### 12. Dependencies

The following packages **must** be installed:

| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `react-markdown` | Markdown rendering |
| `remark-gfm` | GitHub-flavored Markdown plugin |
| `react-syntax-highlighter` | Code block syntax highlighting |
| `@types/react-syntax-highlighter` | TypeScript types |
| `lucide-react` | Icon library (matches ChatGPT-style icons) |

---

### 13. Accessibility & UX

13.1. All interactive elements **must** have accessible labels (`aria-label` or visible text).

13.2. The message list **must** have `role="log"` and `aria-live="polite"`.

13.3. The textarea **must** have an `aria-label` and support keyboard navigation.

13.4. Focus **must** be managed: sidebar close button receives focus when the sidebar opens on mobile.

---

### 14. Testing

14.1. Each component listed in §10 **must** have a corresponding unit test file under `src/tests/`.

14.2. `ChatInput` tests **must** cover: empty submit blocked, Enter submits, Shift+Enter inserts newline, disabled during streaming.

14.3. `useChatStream` **must** be tested with a mocked `streamChat` that yields a controlled sequence of events.

14.4. `useTheme` **must** be tested for: initial detection, set + persist, and fallback behavior.

14.5. `MessageBubble` **must** render all message role variants without errors.

---

## Out of Scope

- Conversation history persistence (backend or localStorage).
- User authentication.
- File/image upload in messages.
- Message editing or regeneration.
- Copy-to-clipboard on code blocks (deferred to next spec).
- Mobile PWA / offline support.

## Dependencies

- `spec-0001-project-setup.md` — must be `done`.

## Acceptance Criteria

- [ ] `npm run dev` renders the full layout (sidebar + chat page) in dark theme by default.
- [ ] Switching theme via `ThemeSelector` applies the theme immediately and persists across page reload.
- [ ] Typing a message and pressing Enter sends a POST to `/api/v1/chat` and streams the response token by token.
- [ ] The thinking indicator appears before `content_delta` events arrive.
- [ ] Tool call and tool result cards render when the API emits those events.
- [ ] Pressing **Stop** during streaming aborts the request.
- [ ] The sidebar collapses on mobile and can be toggled open.
- [ ] `npm run lint` exits 0.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm run test` passes all unit tests.
- [ ] `npm run build` produces a clean `dist/`.
