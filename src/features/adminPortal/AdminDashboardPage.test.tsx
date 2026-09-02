import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApplicationApi } from '../adminApplications/adminApplicationApi';
import { notificationApi } from '../notifications/notificationApi';
import { scholarshipApi } from '../scholarship/scholarshipApi';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../adminApplications/adminApplicationApi', () => ({
  adminApplicationApi: { list: vi.fn() },
}));
vi.mock('../notifications/notificationApi', () => ({ notificationApi: { campaigns: vi.fn() } }));
vi.mock('../scholarship/scholarshipApi', () => ({ scholarshipApi: { programs: vi.fn() } }));

describe('AdminDashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('combines operational counts and links to critical admin screens', async () => {
    vi.mocked(adminApplicationApi.list).mockResolvedValue({
      content: [],
      page: 0,
      size: 5,
      totalElements: 12,
      totalPages: 3,
    });
    vi.mocked(notificationApi.campaigns).mockResolvedValue([
      {
        id: 'campaign-1',
        subject: 'Sonuç',
        status: 'COMPLETED',
        recipientCount: 8,
        sentCount: 6,
        failedCount: 2,
        createdAt: '2026-09-02T08:00:00Z',
        version: 1,
      },
    ]);
    vi.mocked(scholarshipApi.programs).mockResolvedValue([
      {
        id: 'program-1',
        name: 'Başarı Bursu',
        slug: 'basari',
        description: '',
        active: true,
        version: 1,
      },
    ]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Yönetim merkezi' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Yönetim özeti' });
    expect(within(summary).getByText('12')).toBeInTheDocument();
    expect(within(summary).getByText('1')).toBeInTheDocument();
    expect(within(summary).getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit kayıtları ekranını aç' })).toHaveAttribute(
      'href',
      '/admin/audit',
    );
  });
});
