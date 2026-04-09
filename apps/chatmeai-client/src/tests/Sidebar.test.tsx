import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from '@/components/Layout/Sidebar'
import { useChatStore } from '@/store/useChatStore'

vi.mock('@/services/chatService', () => ({
  streamChat: vi.fn(),
  getConversations: vi.fn().mockResolvedValue([]),
}))

function renderSidebar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Sidebar />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  useChatStore.setState({ messages: [], conversationId: null, isStreaming: false })
})

describe('Sidebar', () => {
  it('renders New Chat button', () => {
    renderSidebar()
    expect(screen.getByLabelText('New chat')).toBeInTheDocument()
  })

  it('renders theme selector', () => {
    renderSidebar()
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument()
  })

  it('renders settings button', () => {
    renderSidebar()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
  })

  it('shows empty state when no conversations', () => {
    renderSidebar()
    expect(screen.getByText('No conversations yet')).toBeInTheDocument()
  })

  it('new chat button resets store', () => {
    useChatStore.setState({ conversationId: 'abc-123' })
    renderSidebar()
    fireEvent.click(screen.getByLabelText('New chat'))
    expect(useChatStore.getState().conversationId).toBeNull()
  })
})
