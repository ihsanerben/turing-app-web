import { apiClient } from '../../api/apiClient';

export type PublicAppConfig = {
  applicationName: string;
  tagline: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string;
  supportPhone: string | null;
  contactAddress: string | null;
  footerText: string;
  maintenanceNoticeEnabled: boolean;
  maintenanceNotice: string | null;
};

export type AdminAppConfig = PublicAppConfig & {
  updatedAt: string;
  version: number;
};

export const fallbackAppConfig: PublicAppConfig = {
  applicationName: 'Turing Otomobil Kurumu',
  tagline: 'Eğitime destek, geleceğe yatırım.',
  logoUrl: null,
  primaryColor: '#3855CF',
  supportEmail: 'info@turing.local',
  supportPhone: null,
  contactAddress: null,
  footerText: 'Turing Otomobil Kurumu',
  maintenanceNoticeEnabled: false,
  maintenanceNotice: null,
};

export const appConfigApi = {
  publicConfig: () =>
    apiClient.get<PublicAppConfig>('/api/public/app-config').then((response) => response.data),
  adminConfig: () =>
    apiClient.get<AdminAppConfig>('/api/admin/app-config').then((response) => response.data),
  update: (value: AdminAppConfig) =>
    apiClient.put<AdminAppConfig>('/api/admin/app-config', value).then((response) => response.data),
};
