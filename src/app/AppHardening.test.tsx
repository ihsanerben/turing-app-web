import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';
import { NotFoundPage } from './NotFoundPage';

function BrokenPage(): never {
  throw new Error('render failure');
}

describe('application hardening fallbacks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows an explicit not-found page', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ana sayfaya dön' })).toHaveAttribute('href', '/');
  });

  it('contains unexpected render failures', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenPage />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Sayfa görüntülenemedi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sayfayı yeniden yükle' })).toBeInTheDocument();
  });
});
