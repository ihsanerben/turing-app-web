import { apiClient } from '../../api/apiClient';
import type { Announcement } from './publicContentApi';
export const adminContentApi = {
  announcements: () =>
    apiClient.get<Announcement[]>('/api/admin/announcements').then((r) => r.data),
  createAnnouncement: (body: Record<string, unknown>) =>
    apiClient.post<Announcement>('/api/admin/announcements', body).then((r) => r.data),
  updateAnnouncement: (v: Announcement, body: Record<string, unknown>) =>
    apiClient
      .put<Announcement>(`/api/admin/announcements/${v.id}`, { ...body, version: v.version })
      .then((r) => r.data),
  publish: (v: Announcement) =>
    apiClient
      .post<Announcement>(`/api/admin/announcements/${v.id}/publish`, { version: v.version })
      .then((r) => r.data),
  archiveAnnouncement: (v: Announcement) =>
    apiClient
      .post<Announcement>(`/api/admin/announcements/${v.id}/archive`, { version: v.version })
      .then((r) => r.data),
  restoreAnnouncement: (v: Announcement) =>
    apiClient
      .post<Announcement>(`/api/admin/announcements/${v.id}/restore`, { version: v.version })
      .then((r) => r.data),
  deleteAnnouncement: (v: Announcement) =>
    apiClient.delete(`/api/admin/announcements/${v.id}?version=${v.version}`),
};
