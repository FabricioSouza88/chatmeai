import { useState, useRef, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { getInitials } from '@/utils/initials'

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold text-white flex-shrink-0"
      style={{ backgroundColor: 'var(--color-accent)' }}
    >
      {initials}
    </div>
  )
}

export function UserAvatar() {
  const name = useUserStore((s) => s.name)
  const email = useUserStore((s) => s.email)
  const resetUser = useUserStore((s) => s.resetUser)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const initials = getInitials(name)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleLogout() {
    resetUser()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* User info row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <AvatarCircle initials={initials} />
            <div className="min-w-0">
              <p
                className="text-sm font-semibold leading-tight truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {name}
              </p>
              <p
                className="text-xs mt-0.5 truncate"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {email}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)' }} />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:opacity-80 focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
