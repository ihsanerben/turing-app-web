import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <main className="app" aria-label="Admin portalı">
      <Outlet />
    </main>
  )
}
