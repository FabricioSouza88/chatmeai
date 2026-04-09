import { render, screen } from '@testing-library/react'
import { ThinkingIndicator } from '@/components/Chat/ThinkingIndicator'

describe('ThinkingIndicator', () => {
  it('renders three animated dots', () => {
    render(<ThinkingIndicator />)
    expect(screen.getByLabelText('Thinking')).toBeInTheDocument()
  })
})
