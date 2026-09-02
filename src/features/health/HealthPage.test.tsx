import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthPage } from './HealthPage';
import { getHealth } from './healthApi';

vi.mock('./healthApi', () => ({
  getHealth: vi.fn(),
}));

const mockedGetHealth = vi.mocked(getHealth);

describe('HealthPage', () => {
  beforeEach(() => {
    mockedGetHealth.mockReset();
  });

  it('shows the connected API and database state', async () => {
    mockedGetHealth.mockResolvedValue({ status: 'ok', database: 'up' });

    render(<HealthPage />);

    expect(screen.getByRole('status')).toHaveTextContent('kontrol ediliyor');
    expect(await screen.findByText(/PostgreSQL bağlı/)).toBeInTheDocument();
  });

  it('shows a safe message when the API is unavailable', async () => {
    mockedGetHealth.mockRejectedValue(new Error('network error'));

    render(<HealthPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API bağlantısı kurulamadı');
  });
});
