import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <main className="app">
      <Outlet />
    </main>
  )
}
