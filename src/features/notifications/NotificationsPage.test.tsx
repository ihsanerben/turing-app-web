import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsPage } from './NotificationsPage';
import { AdminEmailCampaignsPage } from './AdminEmailCampaignsPage';
import { notificationApi } from './notificationApi';
vi.mock('../audience/audienceListApi', () => ({
  audienceListApi: { all: vi.fn().mockResolvedValue([]) },
}));
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
  it('opens campaign content, attachment and audience list in a modal', async () => {
    const summary = {
      id: 'c1',
      subject: 'Mülakat duyurusu',
      status: 'DRAFT' as const,
      recipientCount: 2,
      sentCount: 0,
      failedCount: 0,
      createdAt: '2026-09-02T08:00:00Z',
      version: 0,
    };
    vi.mocked(notificationApi.campaigns).mockResolvedValue([summary]);
    vi.mocked(notificationApi.campaign).mockResolvedValue({
      ...summary,
      body: 'Mülakat bilgileri ektedir.',
      attachmentName: 'program.pdf',
      audienceListId: 'list-1',
      audienceListName: 'Olumlu adaylar',
      recipients: [],
    });
    render(<AdminEmailCampaignsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Mülakat duyurusu/ }));
    expect(await screen.findByRole('dialog', { name: 'Mülakat duyurusu' })).toBeInTheDocument();
    expect(screen.getByText('Mülakat bilgileri ektedir.')).toBeInTheDocument();
    expect(screen.getByText('program.pdf')).toBeInTheDocument();
    expect(screen.getByText('Olumlu adaylar')).toBeInTheDocument();
  });
});
