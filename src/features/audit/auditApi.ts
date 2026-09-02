import { apiClient } from '../../api/apiClient';

export type AuditLog = {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  ipReference: string | null;
  requestId: string | null;
  createdAt: string;
};

export type AuditLogPage = {
  content: AuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export const auditApi = {
  list: (params: URLSearchParams) =>
    apiClient
      .get<AuditLogPage>(`/api/admin/audit-logs?${params}`)
      .then((response) => response.data),
};
