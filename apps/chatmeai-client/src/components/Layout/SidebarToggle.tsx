import { Menu, X } from 'lucide-react'

interface SidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      className="p-2 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      {isOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  )
}
