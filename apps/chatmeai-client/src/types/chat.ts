export interface Conversation {
  conversation_id: string
  name: string
  created_at: string
  updated_at: string
}

export type MessageRole = 'user' | 'assistant' | 'tool_call' | 'tool_result'

export interface Message {
  id: string
  role: MessageRole
  content: string
  toolName?: string
  arguments?: Record<string, unknown>
}

export type ChatEvent =
  | { type: 'session_start'; conversation_id: string }
  | { type: 'thinking' }
  | { type: 'content_delta'; delta: string }
  | { type: 'tool_call'; tool_name: string; arguments: Record<string, unknown> }
  | { type: 'tool_result'; tool_name: string; result: string }
  | { type: 'done'; finish_reason: string }
  | { type: 'error'; message: string }
