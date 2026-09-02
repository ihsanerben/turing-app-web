import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationListPage } from './ApplicationListPage';
import { applicationApi } from './applicationApi';

vi.mock('./applicationApi', () => ({
  applicationApi: { list: vi.fn(), scholarships: vi.fn(), create: vi.fn() },
}));
describe('ApplicationListPage', () => {
  it('shows drafts and disables already used periods', async () => {
    vi.mocked(applicationApi.list).mockResolvedValue([
      {
        id: 'app-1',
        periodId: 'period-1',
        periodName: '2026',
        programName: 'Başarı Bursu',
        formId: 'form-1',
        formVersion: 1,
        status: 'DRAFT',
        completion: 50,
        submittedAt: null,
        createdAt: '2026-09-02T00:00:00Z',
        version: 1,
      },
    ]);
    vi.mocked(applicationApi.scholarships).mockResolvedValue([
      {
        program: { id: 'program-1', name: 'Başarı Bursu', slug: 'basari', description: 'Burs' },
        periods: [
          {
            id: 'period-1',
            name: '2026',
            academicYear: '2026-2027',
            startsAt: '',
            endsAt: '',
            status: 'OPEN',
          },
        ],
      },
    ]);
    render(
      <MemoryRouter>
        <ApplicationListPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Başvurularım' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Başvuruya devam et' })).toHaveAttribute(
      'href',
      '/portal/applications/app-1/form',
    );
    expect(screen.getByRole('button', { name: 'Başvuru mevcut' })).toBeDisabled();
  });
});
