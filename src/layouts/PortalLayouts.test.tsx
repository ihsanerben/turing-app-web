import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../features/auth/authContextValue';
import type { User } from '../features/auth/authApi';
import { AdminLayout } from './AdminLayout';
import { StudentLayout } from './StudentLayout';

vi.mock('../features/appConfig/AppBrand', () => ({
  AppBrand: ({ admin = false }: { admin?: boolean }) => (admin ? 'Yönetim' : 'Portal'),
  MaintenanceNotice: () => null,
}));

afterEach(cleanup);

function renderLayout(layout: 'admin' | 'student', user: User) {
  const path = layout === 'admin' ? '/admin' : '/portal';
  return render(
    <AuthContext.Provider value={{ user, loading: false, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={layout === 'admin' ? <AdminLayout /> : <StudentLayout />}>
            <Route index element={<p>İçerik</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('portal layouts', () => {
  it.each([
    ['admin', 'ADMIN'],
    ['student', 'USER'],
  ] as const)('shows the signed-in identity and role in the %s header', (layout, role) => {
    renderLayout(layout, {
      id: 'user-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role,
    });

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(role)).toHaveClass(`role-badge--${role.toLowerCase()}`);
  });
});
