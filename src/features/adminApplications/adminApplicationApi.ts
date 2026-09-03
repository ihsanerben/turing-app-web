import { apiClient } from '../../api/apiClient';
import type { ApplicationStatus } from '../applications/applicationApi';
export type AdminApplication = {
  id: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  university?: string | null;
  department?: string | null;
  periodId: string;
  programId: string;
  periodName: string;
  programName: string;
  status: ApplicationStatus;
  completion: number;
  submittedAt: string | null;
  createdAt: string;
  version: number;
};
export type AdminPage = {
  content: AdminApplication[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
export type AdminDetail = {
  application: AdminApplication;
  answers: { fieldId: string; label: string; value: unknown }[];
  documents: {
    id: string;
    requirementName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
  }[];
  notes: { id: string; adminName: string; content: string; createdAt: string; version: number }[];
  history: {
    oldStatus: ApplicationStatus | null;
    newStatus: ApplicationStatus;
    changedBy: string;
    reason: string | null;
    createdAt: string;
  }[];
};
export const adminApplicationApi = {
  list: (params: URLSearchParams) =>
    apiClient.get<AdminPage>(`/api/admin/applications?${params}`).then((r) => r.data),
  detail: (id: string) =>
    apiClient.get<AdminDetail>(`/api/admin/applications/${id}`).then((r) => r.data),
  saveNote: (id: string, content: string) =>
    apiClient.put(`/api/admin/applications/${id}/note`, { content }),
  downloadDocument: (id: string) =>
    apiClient.get<Blob>(`/api/admin/documents/${id}`, { responseType: 'blob' }).then((r) => r.data),
  changeStatus: (id: string, status: ApplicationStatus, version: number, reason: string) =>
    apiClient
      .patch<AdminDetail>(`/api/admin/applications/${id}/status`, { status, version, reason })
      .then((r) => r.data),
};
