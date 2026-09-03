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
    expect(screen.queryByText(/versiyon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/form oluştur/i)).not.toBeInTheDocument();
  });
});
