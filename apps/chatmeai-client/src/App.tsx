import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/Layout/AppShell'
import { ChatPage } from '@/pages/ChatPage'
import { useThemeStore } from '@/store/useThemeStore'

function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [{ index: true, element: <ChatPage /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

function App() {
  return (
    <>
      <ThemeInitializer />
      <RouterProvider router={router} />
    </>
  )
}

export default App
