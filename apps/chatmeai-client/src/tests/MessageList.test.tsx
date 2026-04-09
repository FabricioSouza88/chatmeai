import { render, screen } from '@testing-library/react'
import { MessageList } from '@/components/Chat/MessageList'
import { useChatStore } from '@/store/useChatStore'

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}))
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}))

beforeEach(() => {
  useChatStore.setState({
    messages: [],
    isStreaming: false,
    isThinking: false,
    conversationId: null,
    addMessage: useChatStore.getState().addMessage,
    appendDelta: useChatStore.getState().appendDelta,
    setStreaming: useChatStore.getState().setStreaming,
    setThinking: useChatStore.getState().setThinking,
    resetChat: useChatStore.getState().resetChat,
    setConversationId: useChatStore.getState().setConversationId,
  })
})

describe('MessageList', () => {
  it('renders with role=log', () => {
    render(<MessageList />)
    expect(screen.getByRole('log')).toBeInTheDocument()
  })

  it('renders all messages', () => {
    useChatStore.setState({
      messages: [
        { id: '1', role: 'user', content: 'Hi' },
        { id: '2', role: 'assistant', content: 'Hello' },
      ],
    })
    render(<MessageList />)
    expect(screen.getByText('Hi')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows ThinkingIndicator when isThinking', () => {
    useChatStore.setState({ isThinking: true })
    render(<MessageList />)
    expect(screen.getByLabelText('Thinking')).toBeInTheDocument()
  })

  it('does not show ThinkingIndicator when not thinking', () => {
    useChatStore.setState({ isThinking: false })
    render(<MessageList />)
    expect(screen.queryByLabelText('Thinking')).not.toBeInTheDocument()
  })
})
