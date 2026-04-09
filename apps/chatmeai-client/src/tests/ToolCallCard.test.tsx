import { render, screen } from '@testing-library/react'
import { ToolCallCard } from '@/components/Chat/ToolCallCard'
import type { Message } from '@/types/chat'

const toolCallMessage: Message = {
  id: '1',
  role: 'tool_call',
  content: '{"query": "weather"}',
  toolName: 'search',
  arguments: { query: 'weather' },
}

describe('ToolCallCard', () => {
  it('renders tool name', () => {
    render(<ToolCallCard message={toolCallMessage} />)
    expect(screen.getByText('search')).toBeInTheDocument()
  })

  it('does not render raw arguments', () => {
    render(<ToolCallCard message={toolCallMessage} />)
    expect(screen.queryByText('{"query": "weather"}')).not.toBeInTheDocument()
  })

  it('renders wrench icon', () => {
    const { container } = render(<ToolCallCard message={toolCallMessage} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
