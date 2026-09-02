import { apiClient } from '../../api/apiClient';

export type EducationLevel = 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE';
export type University = { id: string; name: string; countryCode: string };
export type Department = { id: string; universityId: string; name: string; faculty: string | null };
export type Profile = {
  id: string | null;
  userId: string;
  version: number | null;
  nationalId: string | null;
  birthDate: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
  universityId: string | null;
  universityName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  otherUniversity: string | null;
  otherDepartment: string | null;
  educationLevel: EducationLevel | null;
  studyYear: number | null;
  gpa: number | null;
  updatedAt: string | null;
};

export const profileApi = {
  get: () => apiClient.get<Profile>('/api/me/profile').then(({ data }) => data),
  update: (profile: Profile) =>
    apiClient
      .put<Profile>('/api/me/profile', {
        version: profile.version,
        nationalId: profile.nationalId,
        birthDate: profile.birthDate,
        phone: profile.phone,
        addressLine: profile.addressLine,
        city: profile.city,
        postalCode: profile.postalCode,
        countryCode: profile.countryCode,
        universityId: profile.universityId,
        departmentId: profile.departmentId,
        otherUniversity: profile.otherUniversity,
        otherDepartment: profile.otherDepartment,
        educationLevel: profile.educationLevel,
        studyYear: profile.studyYear,
        gpa: profile.gpa,
      })
      .then(({ data }) => data),
  universities: () => apiClient.get<University[]>('/api/universities').then(({ data }) => data),
  departments: (universityId: string) =>
    apiClient
      .get<Department[]>(`/api/universities/${universityId}/departments`)
      .then(({ data }) => data),
};
