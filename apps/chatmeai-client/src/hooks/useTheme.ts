import { useEffect } from 'react'
import { useThemeStore } from '@/store/useThemeStore'

export const AVAILABLE_THEMES = ['light', 'dark'] as const

export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return {
    theme,
    setTheme,
    themes: AVAILABLE_THEMES as unknown as string[],
  }
}
