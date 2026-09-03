import { Link, Outlet } from 'react-router-dom';
import { AppBrand, MaintenanceNotice } from '../features/appConfig/AppBrand';
import { useAppConfig } from '../features/appConfig/appConfigContextValue';

export function PublicLayout() {
  const { config } = useAppConfig();
  return (
    <main className="public-shell">
      <MaintenanceNotice />
      <nav className="public-nav">
        <Link className="brand" to="/">
          <AppBrand />
        </Link>
        <div>
          <Link to="/">Anasayfa</Link>
          <Link to="/announcements">Duyurular</Link>
          <Link to="/about">Hakkımızda</Link>
          <Link to="/scholarships">Başvurular</Link>
          <Link className="login-link" to="/login">
            Başvuru Girişi
          </Link>
        </div>
      </nav>
      <Outlet />
      <footer className="public-footer">{config.footerText}</footer>
    </main>
  );
}
