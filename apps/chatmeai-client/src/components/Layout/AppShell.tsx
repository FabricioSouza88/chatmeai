import { createContext, useContext, useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SidebarToggle } from './SidebarToggle'
import { UserAvatar } from '@/components/User/UserAvatar'

interface SidebarCtx {
  isOpen: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarCtx>({ isOpen: true, toggle: () => {} })

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => useContext(SidebarContext)

export function AppShell() {
  const [isOpen, setIsOpen] = useState(true)
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      <div
        className="flex h-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
      >
        {/* Sidebar — desktop: always rendered, mobile: overlay */}
        {isOpen && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="fixed inset-0 z-20 md:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={toggle}
              aria-hidden="true"
            />
            {/* Sidebar panel */}
            <aside
              className="fixed inset-y-0 left-0 z-30 w-[260px] md:relative md:z-auto"
              aria-label="Sidebar"
            >
              <Sidebar />
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center px-3 py-2">
            <SidebarToggle isOpen={isOpen} onToggle={toggle} />
            <div className="ml-auto">
              <UserAvatar />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
