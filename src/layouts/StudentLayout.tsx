import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContextValue';

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
      <header className="student-header">
        <NavLink className="student-brand" to="/portal" end>
          <span>T</span>
          Turing Scholarship
        </NavLink>
        <div className="student-account">
          <span>{user ? `${user.firstName} ${user.lastName}` : 'Öğrenci'}</span>
          <button type="button" disabled={loggingOut} onClick={() => void handleLogout()}>
            {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </button>
        </div>
      </header>
      <div className="student-body">
        <nav className="portal-nav" aria-label="Öğrenci portalı menüsü">
          <NavLink to="/portal" end>
            Genel bakış
          </NavLink>
          <NavLink to="/portal/profile">Profilim</NavLink>
          <NavLink to="/portal/applications">Başvurularım</NavLink>
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
