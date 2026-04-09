import type { Message } from '@/types/chat'
import { MarkdownRenderer } from './MarkdownRenderer'
import { ToolCallCard } from './ToolCallCard'

interface MessageBubbleProps {
  message: Message
  showCursor?: boolean
}

export function MessageBubble({ message, showCursor = false }: MessageBubbleProps) {
  if (message.role === 'tool_call') {
    return <ToolCallCard message={message} />
  }

  if (message.role === 'tool_result') {
    return null
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div
          className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
          style={{ backgroundColor: 'var(--color-user-bubble)', color: 'var(--color-text-primary)' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  // assistant
  return (
    <div className="mb-6 max-w-[85%]">
      <div
        className="prose prose-sm max-w-none text-sm leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <MarkdownRenderer content={message.content} />
        {showCursor && <span className="cursor-blink" aria-hidden="true" />}
      </div>
    </div>
  )
}
