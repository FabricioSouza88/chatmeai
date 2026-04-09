import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { MessageBubble } from './MessageBubble'
import { ThinkingIndicator } from './ThinkingIndicator'

export function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const isThinking = useChatStore((s) => s.isThinking)

  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming, isThinking, isAtBottom])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const threshold = 60
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold)
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="max-w-3xl mx-auto">
        {messages
          .filter((m) => isStreaming || (m.role !== 'tool_call' && m.role !== 'tool_result'))
          .map((message, idx, arr) => (
            <MessageBubble
              key={message.id}
              message={message}
              showCursor={isStreaming && message.role === 'assistant' && idx === arr.length - 1}
            />
          ))}
        {isThinking && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
