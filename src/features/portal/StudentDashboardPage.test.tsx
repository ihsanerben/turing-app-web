import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applicationApi } from '../applications/applicationApi';
import { interviewApi } from '../interviews/interviewApi';
import { notificationApi } from '../notifications/notificationApi';
import { profileApi } from '../profile/profileApi';
import { StudentDashboardPage } from './StudentDashboardPage';

vi.mock('../auth/authContextValue', () => ({
  useAuth: () => ({ user: { firstName: 'Ada', lastName: 'Lovelace' } }),
}));
vi.mock('../profile/profileApi', () => ({ profileApi: { get: vi.fn() } }));
vi.mock('../applications/applicationApi', () => ({ applicationApi: { list: vi.fn() } }));
vi.mock('../interviews/interviewApi', () => ({ interviewApi: { mine: vi.fn() } }));
vi.mock('../notifications/notificationApi', () => ({ notificationApi: { mine: vi.fn() } }));

describe('StudentDashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('combines the student data and prioritizes a missing document action', async () => {
    vi.mocked(profileApi.get).mockResolvedValue({ id: 'profile-1' } as never);
    vi.mocked(applicationApi.list).mockResolvedValue([
      {
        id: 'application-1',
        periodId: 'period-1',
        periodName: '2026-2027',
        programName: 'Başarı Bursu',
        formId: 'form-1',
        formVersion: 1,
        status: 'MISSING_DOCUMENT',
        completion: 100,
        submittedAt: '2026-09-01T08:00:00Z',
        createdAt: '2026-08-20T08:00:00Z',
        version: 2,
      },
    ]);
    vi.mocked(interviewApi.mine).mockResolvedValue([]);
    vi.mocked(notificationApi.mine).mockResolvedValue([
      {
        id: 'notification-1',
        title: 'Belge gerekli',
        message: 'Belgenizi güncelleyin.',
        type: 'APPLICATION_STATUS',
        relatedType: 'APPLICATION',
        relatedId: 'application-1',
        readAt: null,
        createdAt: '2026-09-02T08:00:00Z',
      },
    ]);

    render(
      <MemoryRouter>
        <StudentDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Merhaba, Ada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Belgeleri tamamla' })).toHaveAttribute(
      'href',
      '/portal/applications/application-1/form',
    );
    expect(screen.getByText('Belge bekleniyor')).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Portal özeti' });
    expect(within(summary).getAllByText('1')).toHaveLength(2);
  });

  it('directs a student without a saved profile to profile setup', async () => {
    vi.mocked(profileApi.get).mockResolvedValue({ id: null } as never);
    vi.mocked(applicationApi.list).mockResolvedValue([]);
    vi.mocked(interviewApi.mine).mockResolvedValue([]);
    vi.mocked(notificationApi.mine).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <StudentDashboardPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Profilinizi tamamlayın' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile git' })).toHaveAttribute(
      'href',
      '/portal/profile',
    );
  });
});
