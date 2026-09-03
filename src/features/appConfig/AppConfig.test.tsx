import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAppConfigPanel } from './AdminAppConfigPanel';
import { AppBrand, MaintenanceNotice } from './AppBrand';
import { AppConfigProvider } from './AppConfigContext';
import { appConfigApi, type AdminAppConfig } from './appConfigApi';

vi.mock('./appConfigApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('./appConfigApi')>();
  return {
    ...original,
    appConfigApi: {
      publicConfig: vi.fn(),
      adminConfig: vi.fn(),
      update: vi.fn(),
    },
  };
});

const config: AdminAppConfig = {
  applicationName: 'Turing Bursları',
  tagline: 'Eğitim yolculuğunda yanınızda.',
  logoUrl: null,
  primaryColor: '#123ABC',
  supportEmail: 'destek@example.com',
  supportPhone: null,
  contactAddress: null,
  footerText: 'Turing Bursları',
  maintenanceNoticeEnabled: true,
  maintenanceNotice: 'Planlı bakım yapılacaktır.',
  updatedAt: '2026-09-02T10:00:00Z',
  version: 1,
};

describe('dynamic app configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appConfigApi.publicConfig).mockResolvedValue(config);
    vi.mocked(appConfigApi.adminConfig).mockResolvedValue(config);
    vi.mocked(appConfigApi.update).mockResolvedValue({ ...config, version: 2 });
  });

  it('applies public branding and maintenance values', async () => {
    render(
      <AppConfigProvider>
        <AppBrand />
        <MaintenanceNotice />
      </AppConfigProvider>,
    );

    expect(await screen.findByText('Turing Bursları')).toBeInTheDocument();
    expect(screen.getByText('Planlı bakım yapılacaktır.')).toBeInTheDocument();
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123ABC'),
    );
  });

  it('updates configuration and refreshes the public value', async () => {
    const user = userEvent.setup();
    render(
      <AppConfigProvider>
        <AdminAppConfigPanel />
      </AppConfigProvider>,
    );

    const name = await screen.findByLabelText('Uygulama adı');
    await user.clear(name);
    await user.type(name, 'Yeni Uygulama Adı');
    await user.click(screen.getByRole('button', { name: 'Ayarları kaydet' }));

    expect(appConfigApi.update).toHaveBeenCalledWith(
      expect.objectContaining({ applicationName: 'Yeni Uygulama Adı', version: 1 }),
    );
    expect(await screen.findByText('Uygulama ayarları kaydedildi.')).toBeInTheDocument();
    expect(appConfigApi.publicConfig).toHaveBeenCalledTimes(2);
  });
});
