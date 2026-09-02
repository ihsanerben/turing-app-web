import { Link, Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <main className="app" aria-label="Admin portalı">
      <nav className="portal-nav"><Link to="/admin">Admin</Link><Link to="/admin/applications">Başvurular</Link><Link to="/admin/programs">Burs yönetimi</Link></nav>
      <Outlet />
    </main>
  )
}
