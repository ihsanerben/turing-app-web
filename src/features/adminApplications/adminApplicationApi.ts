import { apiClient } from '../../api/apiClient';
import type { ApplicationStatus } from '../applications/applicationApi';
export type AdminApplication = {
  id: string;
  studentName: string;
  studentEmail: string;
  periodId: string;
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
  addNote: (id: string, content: string) =>
    apiClient.post(`/api/admin/applications/${id}/notes`, { content }),
  changeStatus: (id: string, status: ApplicationStatus, version: number, reason: string) =>
    apiClient
      .patch<AdminDetail>(`/api/admin/applications/${id}/status`, { status, version, reason })
      .then((r) => r.data),
};
