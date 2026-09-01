import { Outlet } from 'react-router-dom'

export function StudentLayout() {
  return (
    <main className="app" aria-label="Öğrenci portalı">
      <Outlet />
    </main>
  )
}
