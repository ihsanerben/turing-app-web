import { apiClient } from '../../api/apiClient';
import type { ApplicationStatus } from '../applications/applicationApi';
export type AudienceMember = {
  applicationId: string;
  userId: string;
  studentName: string;
  email: string;
  university: string | null;
  department: string | null;
  applicationStatus: ApplicationStatus;
};
export type AudienceList = {
  id: string;
  name: string;
  programId: string;
  programName: string;
  members: AudienceMember[];
  createdAt: string;
  version: number;
};
export const audienceListApi = {
  all: () => apiClient.get<AudienceList[]>('/api/admin/lists').then((response) => response.data),
  create: (name: string, programId: string, applicationIds: string[]) =>
    apiClient
      .post<AudienceList>('/api/admin/lists', { name, programId, applicationIds })
      .then((response) => response.data),
  update: (id: string, name: string, applicationIds: string[], version: number) =>
    apiClient
      .put<AudienceList>(`/api/admin/lists/${id}`, { name, applicationIds, version })
      .then((response) => response.data),
};
