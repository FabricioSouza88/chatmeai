import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const ICONS: Record<string, React.ReactNode> = {
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
}

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="flex gap-1">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          aria-label={`Switch to ${t} theme`}
          title={t.charAt(0).toUpperCase() + t.slice(1)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            theme === t
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {ICONS[t] ?? null}
          <span className="capitalize">{t}</span>
        </button>
      ))}
    </div>
  )
}
