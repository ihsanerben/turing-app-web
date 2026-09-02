import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './authContextValue';

export function AuthGuard({ role }: { role?: 'ADMIN' }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status">Oturum kontrol ediliyor…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/portal" replace />;
  return <Outlet />;
}
