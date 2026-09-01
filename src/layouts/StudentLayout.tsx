import { Link, Outlet } from 'react-router-dom'

export function StudentLayout() {
  return (
    <main className="app" aria-label="Öğrenci portalı">
      <nav className="portal-nav"><Link to="/portal">Portal</Link><Link to="/portal/profile">Profilim</Link></nav>
      <Outlet />
    </main>
  )
}
