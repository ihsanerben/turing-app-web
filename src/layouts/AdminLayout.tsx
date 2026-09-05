import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContextValue';
import { AppBrand, MaintenanceNotice } from '../features/appConfig/AppBrand';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="student-shell admin-shell">
      <MaintenanceNotice />
      <header className="student-header">
        <NavLink className="student-brand" to="/admin" end>
          <AppBrand admin />
        </NavLink>
        <div className="student-account">
          <span className={`role-badge role-badge--${(user?.role ?? 'ADMIN').toLowerCase()}`}>
            {user?.role ?? 'ADMIN'}
          </span>
          <span className="account-name">
            {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
          </span>
          <button
            className="logout-button"
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </button>
        </div>
      </header>
      <div className="student-body admin-body">
        <nav className="portal-nav" aria-label="Admin portalı menüsü">
          <NavLink to="/admin" end>
            Genel bakış
          </NavLink>
          <NavLink to="/admin/programs">Program yönetimi</NavLink>
          <NavLink to="/admin/applications">Gelen başvurular</NavLink>
          <NavLink to="/admin/students">Öğrenciler</NavLink>
          <NavLink to="/admin/admins">Adminler</NavLink>
          <NavLink to="/admin/lists">Listeler</NavLink>
          <NavLink to="/admin/meals">Yemekler</NavLink>
          <NavLink to="/admin/events">Etkinlikler</NavLink>
          <NavLink to="/admin/interviews">Mülakatlar</NavLink>
          <NavLink to="/admin/email">E-posta</NavLink>
          <NavLink to="/admin/content">İçerik</NavLink>
          <NavLink to="/admin/statistics">İstatistikler</NavLink>
          <NavLink to="/admin/audit">Audit kayıtları</NavLink>
        </nav>
        <main className="student-content" aria-label="Admin portalı">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
