import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/Layout/AppShell'

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

describe('AppShell', () => {
  it('renders sidebar and toggle button', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument()
  })
})
