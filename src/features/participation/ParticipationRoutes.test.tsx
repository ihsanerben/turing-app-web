import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { participationApi } from './participationApi';

const auth = vi.hoisted(() => ({
  user: null as null | { id: string; role: string; firstName: string; lastName: string },
  loading: false,
}));
vi.mock('../auth/authContextValue', () => ({ useAuth: () => ({ ...auth, logout: vi.fn() }) }));
vi.mock('../appConfig/AppBrand', () => ({
  AppBrand: () => 'Turing',
  MaintenanceNotice: () => null,
}));
vi.mock('../auth/AuthPages', () => ({
  LoginPage: () => <h1>Giriş</h1>,
  RegisterPage: () => null,
  ForgotPasswordPage: () => null,
  ResetPasswordPage: () => null,
  ResendVerificationPage: () => null,
  VerifyEmailPage: () => null,
}));
vi.mock('../../layouts/PublicLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return { PublicLayout: () => <Outlet /> };
});
vi.mock('../portal/StudentDashboardPage', () => ({
  StudentDashboardPage: () => <h1>Öğrenci ana sayfası</h1>,
}));
vi.mock('./participationApi', () => ({ participationApi: { weeks: vi.fn(), events: vi.fn() } }));
const empty = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, sort: '' };

describe('participation route access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { id: 'student', role: 'USER', firstName: 'Ayşe', lastName: 'Yılmaz' };
    vi.mocked(participationApi.weeks).mockResolvedValue(empty);
    vi.mocked(participationApi.events).mockResolvedValue({ events: empty, version: 0 });
  });
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });
  it.each([
    ['/portal/meals', 'Yemekler'],
    ['/portal/events', 'Etkinlikler'],
  ])('opens %s directly and exposes both navigation links', async (path, title) => {
    window.history.replaceState({}, '', path);
    render(<App />);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Yemekler' })).toHaveAttribute('href', '/portal/meals');
    expect(screen.getByRole('link', { name: 'Etkinlikler' })).toHaveAttribute(
      'href',
      '/portal/events',
    );
  });
  it.each([
    ['/admin/meals', 'Yemekler'],
    ['/admin/events', 'Etkinlikler'],
  ])('opens %s for admin', async (path, title) => {
    auth.user!.role = 'ADMIN';
    window.history.replaceState({}, '', path);
    render(<App />);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  });
  it('redirects an unauthenticated direct link to login', async () => {
    auth.user = null;
    window.history.replaceState({}, '', '/portal/events');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Giriş' })).toBeInTheDocument();
    expect(participationApi.events).not.toHaveBeenCalled();
  });
  it('denies admin participants and creation UI to students', async () => {
    window.history.replaceState({}, '', '/admin/meals');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Öğrenci ana sayfası' })).toBeInTheDocument();
    expect(participationApi.weeks).not.toHaveBeenCalled();
  });
});
