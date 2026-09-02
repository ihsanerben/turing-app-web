import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsPage } from './NotificationsPage';
import { AdminEmailCampaignsPage } from './AdminEmailCampaignsPage';
import { notificationApi } from './notificationApi';
vi.mock('./notificationApi', () => ({
  notificationApi: {
    campaigns: vi.fn(),
    campaign: vi.fn(),
    create: vi.fn(),
    send: vi.fn(),
    retry: vi.fn(),
    mine: vi.fn(),
    read: vi.fn(),
  },
}));
describe('notification pages', () => {
  beforeEach(() => vi.clearAllMocks());
  it('lists and marks a student notification read', async () => {
    const value = {
      id: 'n1',
      title: 'Mülakat planlandı',
      message: 'Yeni bir mülakat planlandı.',
      type: 'INTERVIEW',
      relatedType: 'INTERVIEW',
      relatedId: 'i1',
      readAt: null,
      createdAt: '2026-09-02T08:00:00Z',
    };
    vi.mocked(notificationApi.mine).mockResolvedValue([value]);
    vi.mocked(notificationApi.read).mockResolvedValue({ ...value, readAt: '2026-09-02T09:00:00Z' });
    render(<NotificationsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Okundu işaretle' }));
    await waitFor(() => expect(notificationApi.read).toHaveBeenCalledWith('n1'));
    expect(screen.queryByRole('button', { name: 'Okundu işaretle' })).not.toBeInTheDocument();
  });
  it('shows campaign delivery results', async () => {
    vi.mocked(notificationApi.campaigns).mockResolvedValue([
      {
        id: 'c1',
        subject: 'Duyuru',
        status: 'COMPLETED',
        recipientCount: 2,
        sentCount: 1,
        failedCount: 1,
        createdAt: '2026-09-02T08:00:00Z',
        version: 2,
      },
    ]);
    render(<AdminEmailCampaignsPage />);
    expect(await screen.findByText(/1\/2 gönderildi/)).toBeInTheDocument();
  });
});
