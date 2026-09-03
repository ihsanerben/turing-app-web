import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProgramsPage } from './ProgramsPage';
import { applicationApi } from './applicationApi';

vi.mock('./applicationApi', () => ({
  applicationApi: {
    list: vi.fn(),
    scholarships: vi.fn(),
    create: vi.fn(),
  },
}));

describe('ProgramsPage', () => {
  it('lists published programs independently from existing applications', async () => {
    vi.mocked(applicationApi.list).mockResolvedValue([]);
    vi.mocked(applicationApi.scholarships).mockResolvedValue([
      {
        program: {
          id: 'program-1',
          name: 'Üniversite destek programı',
          slug: 'universite-destek-programi',
          description: 'Öğrenci destek programı',
        },
        periods: [
          {
            id: 'period-1',
            name: '2026 başvuruları',
            academicYear: '2026-2027',
            startsAt: '2026-09-01T09:00:00Z',
            endsAt: '2026-09-30T18:00:00Z',
            status: 'OPEN',
          },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <ProgramsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Üniversite destek programı')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Başvur' })).toBeEnabled();
  });
});
