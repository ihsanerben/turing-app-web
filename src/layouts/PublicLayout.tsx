import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <main className="public-shell"><nav className="public-nav"><Link className="brand" to="/">Turing Scholarship</Link><div><Link to="/scholarships">Burslar</Link><Link to="/announcements">Duyurular</Link><Link to="/faq">SSS</Link><Link to="/about">Hakkımızda</Link><Link to="/contact">İletişim</Link><Link to="/login">Giriş</Link></div></nav><Outlet /></main>
  )
}
