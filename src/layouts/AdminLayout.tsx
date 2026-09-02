import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContextValue';

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
      <header className="student-header">
        <NavLink className="student-brand" to="/admin" end>
          <span>T</span>
          Turing Yönetim
        </NavLink>
        <div className="student-account">
          <span>{user ? `${user.firstName} ${user.lastName}` : 'Admin'}</span>
          <button type="button" disabled={loggingOut} onClick={() => void handleLogout()}>
            {loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </button>
        </div>
      </header>
      <div className="student-body admin-body">
        <nav className="portal-nav" aria-label="Admin portalı menüsü">
          <NavLink to="/admin" end>
            Genel bakış
          </NavLink>
          <NavLink to="/admin/applications">Başvurular</NavLink>
          <NavLink to="/admin/programs">Burs yönetimi</NavLink>
          <NavLink to="/admin/evaluation">Değerlendirme</NavLink>
          <NavLink to="/admin/interviews">Mülakatlar</NavLink>
          <NavLink to="/admin/email">E-posta</NavLink>
          <NavLink to="/admin/content">İçerik</NavLink>
          <NavLink to="/admin/audit">Audit kayıtları</NavLink>
        </nav>
        <main className="student-content" aria-label="Admin portalı">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
