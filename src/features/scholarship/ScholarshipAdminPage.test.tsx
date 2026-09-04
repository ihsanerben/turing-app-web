import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScholarshipAdminPage } from './ScholarshipAdminPage';
import { scholarshipApi } from './scholarshipApi';
import { MemoryRouter } from 'react-router-dom';
vi.mock('./scholarshipApi', () => ({
  scholarshipApi: {
    programs: vi.fn(),
    periods: vi.fn(),
    createProgram: vi.fn(),
    updateProgram: vi.fn(),
    createPeriod: vi.fn(),
    updatePeriod: vi.fn(),
    transition: vi.fn(),
    archiveProgram: vi.fn(),
    restoreProgram: vi.fn(),
  },
}));
afterEach(cleanup);
describe('ScholarshipAdminPage', () => {
  it('shows a simple program list and one create action', async () => {
    vi.mocked(scholarshipApi.programs).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ScholarshipAdminPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Program yönetimi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yeni başvuru programı aç' })).toBeEnabled();
    expect(screen.getByLabelText('Başvuru programları')).toBeInTheDocument();
  });

  it('shows program identity, start date and lifecycle without the description', async () => {
    vi.mocked(scholarshipApi.programs).mockResolvedValue([
      {
        id: 'program-1',
        name: 'Üniversite Programı',
        slug: 'universite-programi',
        description: 'Listede görünmemesi gereken açıklama',
        active: true,
        version: 0,
      },
    ]);
    vi.mocked(scholarshipApi.periods).mockResolvedValue([
      {
        id: 'period-1',
        programId: 'program-1',
        programName: 'Üniversite Programı',
        name: '2026',
        academicYear: '2026-2027',
        startsAt: '2026-09-01T09:00:00Z',
        endsAt: '2099-09-30T09:00:00Z',
        status: 'OPEN',
        maxRecipients: null,
        allowWithdrawal: true,
        version: 0,
      },
    ]);
    render(
      <MemoryRouter>
        <ScholarshipAdminPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Üniversite Programı')).toBeInTheDocument();
    expect(screen.getByText('Program ID: program-1')).toBeInTheDocument();
    expect(screen.getByText(/Başlangıç: 01\/09\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Program aktif')).toBeInTheDocument();
    expect(screen.queryByText('Listede görünmemesi gereken açıklama')).not.toBeInTheDocument();
  });

  it('shows every program section on the same page before the first save', async () => {
    const user = userEvent.setup();
    vi.mocked(scholarshipApi.programs).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ScholarshipAdminPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Yeni başvuru programı aç' }));

    expect(screen.getByRole('heading', { name: '1. Program bilgileri' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2. Tarihler' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3. Sorular' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '4. İstenen belgeler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kaydet ve yayınla' })).toBeInTheDocument();
    for (const dateInput of screen.getAllByLabelText('Tarih')) {
      expect((dateInput as HTMLInputElement).value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    }
    for (const timeInput of screen.getAllByLabelText('Saat')) {
      expect((timeInput as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/);
    }
    expect(screen.queryByText(/versiyon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/form oluştur/i)).not.toBeInTheDocument();
  });

  it('offers archive for finished programs and restore for archived programs', async () => {
    vi.mocked(scholarshipApi.programs).mockResolvedValue([
      {
        id: 'finished-program',
        name: 'Bitmiş Program',
        slug: 'bitmis-program',
        description: 'Açıklama',
        active: true,
        version: 1,
      },
      {
        id: 'archived-program',
        name: 'Arşiv Programı',
        slug: 'arsiv-programi',
        description: 'Açıklama',
        active: false,
        version: 2,
      },
    ]);
    vi.mocked(scholarshipApi.periods).mockImplementation(async (programId) => [
      {
        id: `${programId}-period`,
        programId,
        programName: programId === 'finished-program' ? 'Bitmiş Program' : 'Arşiv Programı',
        name: '2026',
        academicYear: '2026-2027',
        startsAt: '2026-01-01T09:00:00Z',
        endsAt: '2026-02-01T09:00:00Z',
        status: 'CLOSED',
        maxRecipients: null,
        allowWithdrawal: true,
        version: 1,
      },
    ]);
    render(
      <MemoryRouter>
        <ScholarshipAdminPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('button', { name: 'Arşive al' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Arşivden çıkar' })).toBeInTheDocument();
  });
});
