import { apiClient } from '../../api/apiClient';
export type CampaignSummary = {
  id: string;
  subject: string;
  status: 'DRAFT' | 'SENDING' | 'COMPLETED';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  version: number;
};
export type Recipient = {
  id: string;
  userId: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attemptCount: number;
  failureMessage: string | null;
  sentAt: string | null;
};
export type CampaignDetail = {
  id: string;
  subject: string;
  body: string;
  status: CampaignSummary['status'];
  recipients: Recipient[];
  createdAt: string;
  version: number;
};
export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedType: string | null;
  relatedId: string | null;
  readAt: string | null;
  createdAt: string;
};
export const notificationApi = {
  campaigns: () =>
    apiClient.get<CampaignSummary[]>('/api/admin/email-campaigns').then((r) => r.data),
  campaign: (id: string) =>
    apiClient.get<CampaignDetail>(`/api/admin/email-campaigns/${id}`).then((r) => r.data),
  create: (subject: string, body: string, userIds: string[], attachment?: File) => {
    if (!attachment)
      return apiClient
        .post<CampaignDetail>('/api/admin/email-campaigns', { subject, body, userIds })
        .then((r) => r.data);
    const data = new FormData();
    data.append(
      'campaign',
      new Blob([JSON.stringify({ subject, body, userIds })], { type: 'application/json' }),
    );
    data.append('attachment', attachment);
    return apiClient.post<CampaignDetail>('/api/admin/email-campaigns', data).then((r) => r.data);
  },
  send: (v: CampaignDetail) =>
    apiClient
      .post<CampaignDetail>(`/api/admin/email-campaigns/${v.id}/send`, { version: v.version })
      .then((r) => r.data),
  retry: (v: CampaignDetail) =>
    apiClient
      .post<CampaignDetail>(`/api/admin/email-campaigns/${v.id}/retry-failed`, {
        version: v.version,
      })
      .then((r) => r.data),
  mine: () => apiClient.get<Notification[]>('/api/me/notifications').then((r) => r.data),
  read: (id: string) =>
    apiClient.patch<Notification>(`/api/me/notifications/${id}/read`).then((r) => r.data),
};
