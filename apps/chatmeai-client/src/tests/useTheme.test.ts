import { renderHook, act } from '@testing-library/react'
import { useTheme } from '@/hooks/useTheme'
import { useThemeStore } from '@/store/useThemeStore'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  useThemeStore.setState({ theme: 'dark', setTheme: useThemeStore.getState().setTheme })
})

describe('useTheme', () => {
  it('returns current theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('returns available themes list', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.themes).toContain('light')
    expect(result.current.themes).toContain('dark')
  })

  it('applies data-theme attribute on mount', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))
    expect(localStorage.getItem('chatme-theme')).toBe('light')
  })

  it('updates data-theme attribute when theme changes', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('light'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
