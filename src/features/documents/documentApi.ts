import { apiClient } from '../../api/apiClient';

export type DocumentRequirement = {
  id: string;
  periodId: string;
  name: string;
  description: string | null;
  required: boolean;
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  order: number;
};
export type StoredFile = {
  id: string;
  applicationId: string;
  requirementId: string;
  requirementName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  status: 'ACTIVE' | 'REPLACED' | 'DELETED';
  uploadedAt: string;
  version: number;
};

export const documentApi = {
  adminRequirements: (periodId: string) =>
    apiClient
      .get<DocumentRequirement[]>(
        `/api/admin/application-periods/${periodId}/document-requirements`,
      )
      .then((r) => r.data),
  createRequirement: (periodId: string, body: Omit<DocumentRequirement, 'id' | 'periodId'>) =>
    apiClient
      .post<DocumentRequirement>(
        `/api/admin/application-periods/${periodId}/document-requirements`,
        body,
      )
      .then((r) => r.data),
  updateRequirement: (
    periodId: string,
    requirementId: string,
    body: Omit<DocumentRequirement, 'id' | 'periodId'>,
  ) =>
    apiClient
      .put<DocumentRequirement>(
        `/api/admin/application-periods/${periodId}/document-requirements/${requirementId}`,
        body,
      )
      .then((r) => r.data),
  deleteRequirement: (periodId: string, requirementId: string) =>
    apiClient.delete(
      `/api/admin/application-periods/${periodId}/document-requirements/${requirementId}`,
    ),
  requirements: (applicationId: string) =>
    apiClient
      .get<DocumentRequirement[]>(`/api/me/applications/${applicationId}/document-requirements`)
      .then((r) => r.data),
  files: (applicationId: string) =>
    apiClient
      .get<StoredFile[]>(`/api/me/applications/${applicationId}/documents`)
      .then((r) => r.data),
  upload: (applicationId: string, requirementId: string, file: File) => {
    const body = new FormData();
    body.append('requirementId', requirementId);
    body.append('file', file);
    return apiClient
      .post<StoredFile>(`/api/me/applications/${applicationId}/documents`, body)
      .then((r) => r.data);
  },
  remove: (id: string) => apiClient.delete(`/api/me/documents/${id}`),
  download: (id: string) =>
    apiClient.get<Blob>(`/api/me/documents/${id}`, { responseType: 'blob' }).then((r) => r.data),
};
