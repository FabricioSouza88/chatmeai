import { render, screen, fireEvent } from '@testing-library/react'
import { UserAvatar } from '@/components/User/UserAvatar'
import { useUserStore } from '@/store/useUserStore'

beforeEach(() => {
  useUserStore.setState({ name: 'Fabricio Souza', email: 'fabricio@example.com' })
})

describe('UserAvatar', () => {
  it('renders initials from store', () => {
    render(<UserAvatar />)
    expect(screen.getByLabelText('User menu')).toHaveTextContent('FS')
  })

  it('dropdown is hidden by default', () => {
    render(<UserAvatar />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows name and email after click', () => {
    render(<UserAvatar />)
    fireEvent.click(screen.getByLabelText('User menu'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Fabricio Souza')).toBeInTheDocument()
    expect(screen.getByText('fabricio@example.com')).toBeInTheDocument()
  })

  it('shows avatar with initials inside the dropdown', () => {
    render(<UserAvatar />)
    fireEvent.click(screen.getByLabelText('User menu'))
    // header button + avatar inside dropdown both contain 'FS'
    const all = screen.getAllByText('FS')
    expect(all.length).toBeGreaterThanOrEqual(2)
  })

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <UserAvatar />
        <button>outside</button>
      </div>
    )
    fireEvent.click(screen.getByLabelText('User menu'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('logout button calls resetUser and closes dropdown', () => {
    const resetUser = vi.fn()
    useUserStore.setState({ name: 'Fabricio Souza', email: 'fabricio@example.com', resetUser })
    render(<UserAvatar />)
    fireEvent.click(screen.getByLabelText('User menu'))
    fireEvent.click(screen.getByText('Logout'))
    expect(resetUser).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('aria-expanded reflects open state', () => {
    render(<UserAvatar />)
    const btn = screen.getByLabelText('User menu')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})
