import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContextValue';
import { AppBrand, MaintenanceNotice } from '../features/appConfig/AppBrand';

export function StudentLayout() {
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
    <div className="student-shell">
      <MaintenanceNotice />
      <header className="student-header">
        <NavLink className="student-brand" to="/portal" end>
          <AppBrand />
        </NavLink>
        <div className="student-account">
          <span className={`role-badge role-badge--${(user?.role ?? 'USER').toLowerCase()}`}>
            {user?.role ?? 'USER'}
          </span>
          <span className="account-name">
            {user ? `${user.firstName} ${user.lastName}` : 'Öğrenci'}
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
      <div className="student-body">
        <nav className="portal-nav" aria-label="Öğrenci portalı menüsü">
          <NavLink to="/portal" end>
            Genel bakış
          </NavLink>
          <NavLink to="/portal/programs">Programlar</NavLink>
          <NavLink to="/portal/profile">Profilim</NavLink>
          <NavLink to="/portal/applications">Başvurularım</NavLink>
          <NavLink to="/portal/meals">Yemekler</NavLink>
          <NavLink to="/portal/events">Etkinlikler</NavLink>
          <NavLink to="/portal/interviews">Mülakatlarım</NavLink>
          <NavLink to="/portal/notifications">Bildirimler</NavLink>
        </nav>
        <main className="student-content" aria-label="Öğrenci portalı">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
