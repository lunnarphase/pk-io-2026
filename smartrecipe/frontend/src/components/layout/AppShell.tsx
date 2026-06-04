import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'

export function AppShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
