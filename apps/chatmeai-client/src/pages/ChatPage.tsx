import { useChatStore } from '@/store/useChatStore'
import { useChatStream } from '@/hooks/useChatStream'
import { MessageList } from '@/components/Chat/MessageList'
import { ChatInput } from '@/components/Chat/ChatInput'

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4">
      <h1
        className="text-3xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        ChatMe
      </h1>
      <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
        How can I help you today?
      </p>
    </div>
  )
}

export function ChatPage() {
  const messages = useChatStore((s) => s.messages)
  const { isStreaming, send, stop } = useChatStream()

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <>
          <EmptyState />
          <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
        </>
      ) : (
        <>
          <MessageList />
          <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
        </>
      )}
    </div>
  )
}
