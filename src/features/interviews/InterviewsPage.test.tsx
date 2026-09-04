import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentInterviewsPage } from './StudentInterviewsPage';
import { AdminInterviewsPage } from './AdminInterviewsPage';
import { interviewApi, type AdminInterview } from './interviewApi';
vi.mock('../auth/authContextValue', () => ({ useAuth: () => ({ user: { id: 'admin-1' } }) }));
vi.mock('./interviewApi', () => ({
  interviewApi: {
    mine: vi.fn(),
    all: vi.fn(),
    byApplication: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    status: vi.fn(),
    feedback: vi.fn(),
  },
}));
vi.mock('../adminApplications/adminApplicationApi', () => ({
  adminApplicationApi: { list: vi.fn().mockResolvedValue({ content: [] }) },
}));
vi.mock('../audience/audienceListApi', () => ({
  audienceListApi: { all: vi.fn().mockResolvedValue([]) },
}));
const admin: AdminInterview = {
  id: 'i1',
  applicationId: 'a1',
  studentName: 'Ayşe Öğrenci',
  programName: 'Başarı Programı',
  startsAt: '2026-09-03T10:00:00Z',
  endsAt: '2026-09-03T11:00:00Z',
  status: 'COMPLETED',
  locationType: 'ONLINE',
  location: null,
  meetingUrl: 'https://meet.example/i1',
  createdBy: 'Admin User',
  version: 1,
  feedback: [],
};
describe('interview pages', () => {
  beforeEach(() => vi.clearAllMocks());
  it('shows student schedule without internal feedback', async () => {
    vi.mocked(interviewApi.mine).mockResolvedValue([
      { ...admin, programName: 'Başarı Bursu', periodName: '2026' },
    ]);
    render(<StudentInterviewsPage />);
    expect(await screen.findByText('Başarı Bursu')).toBeInTheDocument();
    expect(screen.queryByText('Internal feedback')).not.toBeInTheDocument();
  });
  it('lists interviews and opens the selected interview', async () => {
    vi.mocked(interviewApi.all).mockResolvedValue([admin]);
    render(<AdminInterviewsPage />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Başarı Programı mülakatını düzenle' }),
    );
    expect(await screen.findByRole('heading', { name: 'Mülakat notu' })).toBeInTheDocument();
  });
  it('shows only the field required by the selected interview type', async () => {
    vi.mocked(interviewApi.all).mockResolvedValue([]);
    const view = render(<AdminInterviewsPage />);
    const page = within(view.container);
    fireEvent.click(await page.findByRole('button', { name: 'Yeni mülakat aç' }));

    const type = page.getByRole('combobox', { name: 'Görüşme türü' });
    expect(page.getByRole('textbox', { name: 'Görüşme bağlantısı' })).toBeInTheDocument();
    expect(page.queryByRole('textbox', { name: 'Konum' })).not.toBeInTheDocument();

    fireEvent.change(type, { target: { value: 'IN_PERSON' } });
    expect(page.getByRole('textbox', { name: 'Konum' })).toBeInTheDocument();
    expect(page.queryByRole('textbox', { name: 'Görüşme bağlantısı' })).not.toBeInTheDocument();

    fireEvent.change(type, { target: { value: 'PHONE' } });
    expect(page.queryByRole('textbox', { name: 'Konum' })).not.toBeInTheDocument();
    expect(page.queryByRole('textbox', { name: 'Görüşme bağlantısı' })).not.toBeInTheDocument();
  });
});
