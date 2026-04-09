import { create } from 'zustand'

const STORAGE_KEY = 'chatme-theme'
const DEFAULT_THEME = 'dark'

function getInitialTheme(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

interface ThemeState {
  theme: string
  setTheme: (key: string) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: getInitialTheme(),
  setTheme: (key) => {
    try {
      localStorage.setItem(STORAGE_KEY, key)
    } catch {
      // ignore storage errors
    }
    set({ theme: key })
  },
}))
