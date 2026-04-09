import { render, screen } from '@testing-library/react'
import { MessageBubble } from '@/components/Chat/MessageBubble'
import type { Message } from '@/types/chat'

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}))
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}))

describe('MessageBubble', () => {
  it('renders user message', () => {
    const msg: Message = { id: '1', role: 'user', content: 'Hello!' }
    render(<MessageBubble message={msg} />)
    expect(screen.getByText('Hello!')).toBeInTheDocument()
  })

  it('renders assistant message with markdown', () => {
    const msg: Message = { id: '2', role: 'assistant', content: '**bold**' }
    render(<MessageBubble message={msg} />)
    expect(screen.getByRole('strong')).toBeInTheDocument()
  })

  it('shows streaming cursor when showCursor is true', () => {
    const msg: Message = { id: '3', role: 'assistant', content: 'Hi' }
    const { container } = render(<MessageBubble message={msg} showCursor />)
    expect(container.querySelector('.cursor-blink')).toBeInTheDocument()
  })

  it('does not show cursor by default', () => {
    const msg: Message = { id: '4', role: 'assistant', content: 'Hi' }
    const { container } = render(<MessageBubble message={msg} />)
    expect(container.querySelector('.cursor-blink')).not.toBeInTheDocument()
  })

  it('renders tool_call as ToolCallCard', () => {
    const msg: Message = {
      id: '5',
      role: 'tool_call',
      content: '{}',
      toolName: 'myTool',
    }
    render(<MessageBubble message={msg} />)
    expect(screen.getByText('myTool')).toBeInTheDocument()
  })

  it('does not render tool_result', () => {
    const msg: Message = {
      id: '6',
      role: 'tool_result',
      content: 'result data',
      toolName: 'myTool',
    }
    const { container } = render(<MessageBubble message={msg} />)
    expect(container).toBeEmptyDOMElement()
  })
})
