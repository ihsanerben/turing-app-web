import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementsPage, FaqPage, ScholarshipsPage } from './PublicPages';
import { AdminContentPage } from './AdminContentPage';
import { publicContentApi } from './publicContentApi';
import { adminContentApi } from './adminContentApi';
vi.mock('./publicContentApi', () => ({
  publicContentApi: {
    scholarships: vi.fn(),
    scholarship: vi.fn(),
    announcements: vi.fn(),
    announcement: vi.fn(),
    faqs: vi.fn(),
  },
}));
vi.mock('./adminContentApi', () => ({
  adminContentApi: {
    announcements: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    publish: vi.fn(),
    archiveAnnouncement: vi.fn(),
    faqs: vi.fn(),
    createFaq: vi.fn(),
    updateFaq: vi.fn(),
    archiveFaq: vi.fn(),
  },
}));
describe('public content pages', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it('renders public scholarships and published announcements', async () => {
    vi.mocked(publicContentApi.scholarships).mockResolvedValue([
      {
        program: {
          id: 'p1',
          name: 'Başarı Bursu',
          slug: 'basari',
          description: 'Destek',
          active: true,
          version: 0,
        },
        periods: [],
      },
    ]);
    const { unmount } = render(
      <MemoryRouter>
        <ScholarshipsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Başarı Bursu')).toBeInTheDocument();
    unmount();
    vi.mocked(publicContentApi.announcements).mockResolvedValue([
      {
        id: 'a1',
        title: 'Yeni dönem',
        slug: 'yeni-donem',
        summary: 'Başvurular açılıyor',
        publishedAt: '2026-09-02T08:00:00Z',
      },
    ]);
    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Yeni dönem')).toBeInTheDocument();
  });
  it('renders active FAQs', async () => {
    vi.mocked(publicContentApi.faqs).mockResolvedValue([
      {
        id: 'f1',
        question: 'Kimler başvurabilir?',
        answer: 'Aktif öğrenciler.',
        displayOrder: 1,
        active: true,
        version: 0,
      },
    ]);
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Kimler başvurabilir?')).toBeInTheDocument();
  });
  it('creates a draft from the admin screen', async () => {
    vi.mocked(adminContentApi.announcements).mockResolvedValue([]);
    vi.mocked(adminContentApi.faqs).mockResolvedValue([]);
    vi.mocked(adminContentApi.createAnnouncement).mockResolvedValue({
      id: 'a1',
      title: 'Yeni dönem',
      slug: 'yeni-donem',
      summary: 'Özet',
      content: 'İçerik',
      status: 'DRAFT',
      publishedAt: null,
      version: 0,
    });
    render(
      <MemoryRouter>
        <AdminContentPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Duyurular' });
    fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: 'Yeni dönem' } });
    fireEvent.change(screen.getByLabelText('URL adı'), { target: { value: 'yeni-donem' } });
    fireEvent.change(screen.getByLabelText('Özet'), { target: { value: 'Özet' } });
    fireEvent.change(screen.getByLabelText('İçerik'), { target: { value: 'İçerik' } });
    fireEvent.click(screen.getByRole('button', { name: 'Taslak oluştur' }));
    await waitFor(() => expect(adminContentApi.createAnnouncement).toHaveBeenCalled());
  });
});
