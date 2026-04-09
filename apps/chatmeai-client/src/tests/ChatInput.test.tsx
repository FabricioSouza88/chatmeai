import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from '@/components/Chat/ChatInput'

function setup(props: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const onSend = vi.fn()
  const onStop = vi.fn()
  render(
    <ChatInput
      onSend={onSend}
      onStop={onStop}
      isStreaming={false}
      {...props}
    />
  )
  return { onSend, onStop }
}

describe('ChatInput', () => {
  it('does not submit when empty', async () => {
    const { onSend } = setup()
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('submits on Enter with content', async () => {
    const user = userEvent.setup()
    const { onSend } = setup()
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello')
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('inserts newline on Shift+Enter', async () => {
    const user = userEvent.setup()
    const { onSend } = setup()
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    await user.type(textarea, 'Hello')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables textarea during streaming', () => {
    setup({ isStreaming: true })
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows Stop button during streaming', () => {
    setup({ isStreaming: true })
    expect(screen.getByLabelText('Stop generation')).toBeInTheDocument()
  })

  it('calls onStop when Stop is clicked', () => {
    const { onStop } = setup({ isStreaming: true })
    fireEvent.click(screen.getByLabelText('Stop generation'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('send button is disabled when input is empty', () => {
    setup()
    expect(screen.getByLabelText('Send message')).toBeDisabled()
  })
})
