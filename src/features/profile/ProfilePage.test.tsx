import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { profileApi, type Profile } from './profileApi';

vi.mock('./profileApi', () => ({
  profileApi: { get: vi.fn(), universities: vi.fn(), departments: vi.fn(), update: vi.fn() },
}));

const emptyProfile: Profile = {
  id: null,
  userId: 'user-1',
  version: null,
  nationalId: null,
  birthDate: null,
  phone: null,
  addressLine: null,
  city: null,
  postalCode: null,
  countryCode: null,
  universityId: null,
  universityName: null,
  departmentId: null,
  departmentName: null,
  otherUniversity: null,
  otherDepartment: null,
  educationLevel: null,
  studyYear: null,
  gpa: null,
  updatedAt: null,
};

describe('ProfilePage', () => {
  it('loads the current users isolated profile and reference data', async () => {
    vi.mocked(profileApi.get).mockResolvedValue(emptyProfile);
    vi.mocked(profileApi.universities).mockResolvedValue([
      { id: 'university-1', name: 'Test Üniversitesi', countryCode: 'TR' },
    ]);
    render(<ProfilePage />);
    expect(screen.getByRole('status')).toHaveTextContent('yükleniyor');
    expect(await screen.findByRole('heading', { name: 'Profilim' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Test Üniversitesi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profili kaydet' })).toBeEnabled();
  });
});
