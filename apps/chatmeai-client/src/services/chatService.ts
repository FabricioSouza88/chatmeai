import type { ChatEvent, Conversation } from '@/types/chat'

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/conversations`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<Conversation[]>
}

interface StreamChatOptions {
  message: string
  conversationId?: string
  signal?: AbortSignal
}

export async function* streamChat({
  message,
  conversationId,
  signal,
}: StreamChatOptions): AsyncGenerator<ChatEvent> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId ?? null }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is null')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (!raw) continue
        try {
          yield JSON.parse(raw) as ChatEvent
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
