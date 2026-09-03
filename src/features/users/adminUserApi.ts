import { apiClient } from '../../api/apiClient';

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  accountStatus: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  nationalId: string | null;
  birthDate: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
  universityName: string | null;
  departmentName: string | null;
  otherUniversity: string | null;
  otherDepartment: string | null;
  educationLevel: string | null;
  studyYear: number | null;
  gpa: number | null;
};

export const adminUserApi = {
  students: () => apiClient.get<AdminUser[]>('/api/admin/users/students').then((r) => r.data),
  admins: () => apiClient.get<AdminUser[]>('/api/admin/users/admins').then((r) => r.data),
  get: (id: string) => apiClient.get<AdminUser>(`/api/admin/users/${id}`).then((r) => r.data),
};
