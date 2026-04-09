import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarToggle } from '@/components/Layout/SidebarToggle'

describe('SidebarToggle', () => {
  it('shows open label when closed', () => {
    render(<SidebarToggle isOpen={false} onToggle={() => {}} />)
    expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument()
  })

  it('shows close label when open', () => {
    render(<SidebarToggle isOpen={true} onToggle={() => {}} />)
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<SidebarToggle isOpen={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
