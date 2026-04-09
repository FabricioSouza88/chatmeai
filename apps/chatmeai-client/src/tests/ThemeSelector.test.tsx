import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeSelector } from '@/components/Theme/ThemeSelector'
import { useThemeStore } from '@/store/useThemeStore'

beforeEach(() => {
  useThemeStore.setState({ theme: 'dark', setTheme: useThemeStore.getState().setTheme })
})

describe('ThemeSelector', () => {
  it('renders light and dark buttons', () => {
    render(<ThemeSelector />)
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument()
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument()
  })

  it('switches theme on click', () => {
    render(<ThemeSelector />)
    fireEvent.click(screen.getByLabelText('Switch to light theme'))
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
