import { apiClient } from '../../api/apiClient';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
};

export const authApi = {
  csrf: () => apiClient.get('/api/auth/csrf'),
  me: () => apiClient.get<User>('/api/me').then(({ data }) => data),
  login: (email: string, password: string) =>
    apiClient.post<User>('/api/auth/login', { email, password }).then(({ data }) => data),
  register: (values: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post('/api/auth/register', values),
  logout: () => apiClient.post('/api/auth/logout'),
  verifyEmail: (token: string) => apiClient.post('/api/auth/verify-email', { token }),
  resendVerification: (email: string) => apiClient.post('/api/auth/resend-verification', { email }),
  forgotPassword: (email: string) => apiClient.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/api/auth/reset-password', { token, password }),
};
