import { apiClient } from '../../api/apiClient';
import type { Period, Program } from '../scholarship/scholarshipApi';
export type PublicScholarship = { program: Program; periods: Period[] };
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Announcement = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  status?: AnnouncementStatus;
  publishedAt: string | null;
  createdAt?: string;
  version?: number;
};
export const publicContentApi = {
  scholarships: () =>
    apiClient.get<PublicScholarship[]>('/api/public/scholarships').then((r) => r.data),
  scholarship: (slug: string) =>
    apiClient.get<PublicScholarship>(`/api/public/scholarships/${slug}`).then((r) => r.data),
  announcements: () =>
    apiClient.get<Announcement[]>('/api/public/announcements').then((r) => r.data),
  announcement: (slug: string) =>
    apiClient.get<Announcement>(`/api/public/announcements/${slug}`).then((r) => r.data),
};
