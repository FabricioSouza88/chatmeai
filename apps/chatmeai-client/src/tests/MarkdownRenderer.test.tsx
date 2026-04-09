import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from '@/components/Chat/MarkdownRenderer'

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => <pre data-testid="code-block">{children}</pre>,
}))
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}))

describe('MarkdownRenderer', () => {
  it('renders plain text', () => {
    render(<MarkdownRenderer content="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders bold text', () => {
    render(<MarkdownRenderer content="**bold**" />)
    expect(screen.getByRole('strong')).toBeInTheDocument()
  })

  it('renders fenced code block with syntax highlighter', () => {
    render(<MarkdownRenderer content={'```js\nconst x = 1\n```'} />)
    expect(screen.getByTestId('code-block')).toBeInTheDocument()
  })

  it('renders inline code', () => {
    render(<MarkdownRenderer content="Use `useState`" />)
    expect(screen.getByText('useState')).toBeInTheDocument()
  })
})
