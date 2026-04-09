import { useRef, useEffect, useState } from 'react'
import { Send, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
}

const LINE_HEIGHT = 24
const MAX_ROWS = 6

export function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isStreaming])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, LINE_HEIGHT * MAX_ROWS)}px`
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="px-4 pb-4 pt-2"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="max-w-3xl mx-auto flex items-end gap-3 rounded-2xl border px-4 py-3"
        style={{
          backgroundColor: 'var(--color-input-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
          aria-label="Type your message"
          placeholder="Message ChatMe…"
          className="flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--color-text-secondary)] text-[var(--color-text-primary)] disabled:opacity-50"
          style={{ maxHeight: `${LINE_HEIGHT * MAX_ROWS}px` }}
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            aria-label="Stop generation"
            className="flex-shrink-0 p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            aria-label="Send message"
            className="flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{
              backgroundColor: value.trim() ? 'var(--color-accent)' : 'transparent',
              color: value.trim() ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            <Send size={18} />
          </button>
        )}
      </div>
      <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        ChatMe can make mistakes. Check important info.
      </p>
    </div>
  )
}
