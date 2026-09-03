import { apiClient } from '../../api/apiClient';

export type AdminStatistics = {
  registeredCandidates: number;
  candidatesWithApplication: number;
  totalApplications: number;
  draftApplications: number;
  submittedApplications: number;
  applicationsUnderReview: number;
  approvedApplications: number;
  rejectedApplications: number;
  waitlistedApplications: number;
  averageCompletion: number;
  activePrograms: number;
  scheduledPeriods: number;
  openPeriods: number;
};

export const adminStatisticsApi = {
  get: () =>
    apiClient.get<AdminStatistics>('/api/admin/statistics').then((response) => response.data),
};
