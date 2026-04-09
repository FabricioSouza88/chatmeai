import { useRef, useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { streamChat } from '@/services/chatService'
import type { Message } from '@/types/chat'

function generateId(): string {
  return crypto.randomUUID()
}

export function useChatStream() {
  const {
    isStreaming,
    conversationId,
    addMessage,
    appendDelta,
    setStreaming,
    setThinking,
    setConversationId,
  } = useChatStore()
  const abortRef = useRef<AbortController | null>(null)
  const assistantIdRef = useRef<string>('')

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const send = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return

      const userMessage: Message = { id: generateId(), role: 'user', content }
      addMessage(userMessage)

      const assistantId = generateId()
      assistantIdRef.current = assistantId
      const assistantMessage: Message = { id: assistantId, role: 'assistant', content: '' }
      addMessage(assistantMessage)

      setStreaming(true)
      setThinking(false)

      abortRef.current = new AbortController()

      try {
        for await (const event of streamChat({
          message: content,
          conversationId: conversationId ?? undefined,
          signal: abortRef.current.signal,
        })) {
          if (event.type === 'session_start') {
            setConversationId(event.conversation_id)
          } else if (event.type === 'thinking') {
            setThinking(true)
          } else if (event.type === 'content_delta') {
            setThinking(false)
            appendDelta(assistantId, event.delta)
          } else if (event.type === 'tool_call') {
            const toolCallMsg: Message = {
              id: generateId(),
              role: 'tool_call',
              content: JSON.stringify(event.arguments, null, 2),
              toolName: event.tool_name,
              arguments: event.arguments,
            }
            addMessage(toolCallMsg)
          } else if (event.type === 'tool_result') {
            const toolResultMsg: Message = {
              id: generateId(),
              role: 'tool_result',
              content: event.result,
              toolName: event.tool_name,
            }
            addMessage(toolResultMsg)
          } else if (event.type === 'error') {
            appendDelta(assistantId, `\n\n**Error:** ${event.message}`)
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          appendDelta(assistantId, '\n\n**Connection error.** Please try again.')
        }
      } finally {
        setStreaming(false)
        setThinking(false)
      }
    },
    [isStreaming, conversationId, addMessage, appendDelta, setStreaming, setThinking, setConversationId]
  )

  return { isStreaming, send, stop }
}
