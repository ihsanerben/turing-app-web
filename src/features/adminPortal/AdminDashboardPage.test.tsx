import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminDashboardPage } from './AdminDashboardPage';

describe('AdminDashboardPage', () => {
  it('keeps the overview simple without repeating the side navigation', () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Yönetim merkezi' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
