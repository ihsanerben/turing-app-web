import { apiClient } from '../../api/apiClient';
export type PeriodStatus =
  'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'EVALUATION' | 'COMPLETED' | 'ARCHIVED';
export type Program = {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  version: number;
};
export type Period = {
  id: string;
  programId: string;
  programName: string;
  name: string;
  academicYear: string;
  startsAt: string;
  endsAt: string;
  status: PeriodStatus;
  maxRecipients: number | null;
  allowWithdrawal: boolean;
  version: number;
};
export const scholarshipApi = {
  programs: () => apiClient.get<Program[]>('/api/admin/scholarship-programs').then((r) => r.data),
  createProgram: (body: { name: string; slug: string; description: string }) =>
    apiClient.post<Program>('/api/admin/scholarship-programs', body).then((r) => r.data),
  archiveProgram: (id: string, version: number) =>
    apiClient
      .post<Program>(`/api/admin/scholarship-programs/${id}/archive`, { version })
      .then((r) => r.data),
  periods: (programId: string) =>
    apiClient
      .get<Period[]>('/api/admin/application-periods', { params: { programId } })
      .then((r) => r.data),
  createPeriod: (body: Record<string, unknown>) =>
    apiClient.post<Period>('/api/admin/application-periods', body).then((r) => r.data),
  transition: (period: Period, status: PeriodStatus) =>
    apiClient
      .patch<Period>(`/api/admin/application-periods/${period.id}/status`, {
        version: period.version,
        status,
      })
      .then((r) => r.data),
};
