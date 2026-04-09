import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'

vi.mock('@/services/chatService', () => ({
  streamChat: vi.fn(),
  getConversations: vi.fn().mockResolvedValue([]),
}))
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}))
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}))

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )
    expect(container).toBeInTheDocument()
  })
})
