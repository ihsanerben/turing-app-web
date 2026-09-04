import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminApplicationsPage } from './AdminApplicationsPage';
import { adminApplicationApi, type AdminApplication } from './adminApplicationApi';
import { scholarshipApi } from '../scholarship/scholarshipApi';
import { adminUserApi } from '../users/adminUserApi';

vi.mock('./adminApplicationApi', () => ({
  adminApplicationApi: {
    list: vi.fn(),
    detail: vi.fn(),
    saveNote: vi.fn(),
    changeStatus: vi.fn(),
    downloadDocument: vi.fn(),
  },
}));
vi.mock('../scholarship/scholarshipApi', () => ({
  scholarshipApi: { programs: vi.fn(), periods: vi.fn() },
}));
vi.mock('../users/adminUserApi', () => ({ adminUserApi: { get: vi.fn() } }));
const application: AdminApplication = {
  id: 'app-1',
  studentUserId: 'user-1',
  studentName: 'Ada Lovelace',
  studentEmail: 'ada@example.com',
  periodId: 'period-1',
  programId: 'program-1',
  periodName: '2026 Başvuruları',
  programName: 'Başarı Bursu',
  status: 'SUBMITTED',
  completion: 100,
  submittedAt: '2026-09-02T09:00:00Z',
  createdAt: '2026-09-01T09:00:00Z',
  version: 2,
};

describe('AdminApplicationsPage', () => {
  it('renders paged applications and opens internal detail', async () => {
    vi.mocked(scholarshipApi.programs).mockResolvedValue([
      {
        id: 'program-1',
        name: 'Başarı Bursu',
        slug: 'basari',
        description: '',
        active: true,
        version: 0,
      },
    ]);
    vi.mocked(scholarshipApi.periods).mockResolvedValue([
      {
        id: 'period-1',
        programId: 'program-1',
        programName: 'Başarı Bursu',
        name: '2026 Başvuruları',
        academicYear: '2026-2027',
        startsAt: '2026-09-01T09:00:00Z',
        endsAt: '2099-09-30T09:00:00Z',
        status: 'OPEN',
        maxRecipients: 20,
        allowWithdrawal: true,
        version: 0,
      },
    ]);
    vi.mocked(adminApplicationApi.list).mockResolvedValue({
      content: [application],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(adminApplicationApi.detail).mockResolvedValue({
      application,
      answers: [{ fieldId: 'field-1', label: 'Motivasyon', value: 'Topluma katkı' }],
      documents: [],
      notes: [
        {
          id: 'note-1',
          adminName: 'Admin User',
          content: 'Kontrol edildi.',
          createdAt: '',
          version: 0,
        },
      ],
      history: [],
    });
    vi.mocked(adminUserApi.get).mockResolvedValue({
      id: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      accountStatus: 'ACTIVE',
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: '',
      nationalId: '12345678901',
      birthDate: null,
      phone: null,
      addressLine: null,
      city: null,
      postalCode: null,
      countryCode: null,
      universityName: null,
      departmentName: null,
      otherUniversity: null,
      otherDepartment: null,
      educationLevel: null,
      studyYear: null,
      gpa: null,
    });
    vi.mocked(adminApplicationApi.changeStatus).mockResolvedValue({
      application: { ...application, status: 'APPROVED', version: 3 },
      answers: [],
      documents: [],
      notes: [],
      history: [
        {
          oldStatus: 'SUBMITTED',
          newStatus: 'APPROVED',
          changedBy: 'Admin User',
          reason: 'Uygun bulundu.',
          createdAt: '2026-09-04T09:00:00Z',
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/?programId=program-1']}>
        <AdminApplicationsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Gelen başvurular' })).toBeInTheDocument();
    expect(await screen.findByText(/Başlangıç: 01\/09\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Program aktif')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    expect(await screen.findByRole('dialog', { name: 'Ada Lovelace' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kapat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Detay' }));
    expect(await screen.findByRole('dialog', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.queryByText('Internal not')).not.toBeInTheDocument();
    expect(screen.getByText('Topluma katkı')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Başvuru sonucu' }), {
      target: { value: 'APPROVED' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Gerekçe' }), {
      target: { value: 'Uygun bulundu.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Durumu güncelle' }));
    expect(await screen.findByText('Başvuru sonucu ve gerekçesi güncellendi.')).toBeInTheDocument();
    await waitFor(() =>
      expect(adminApplicationApi.changeStatus).toHaveBeenCalledWith(
        'app-1',
        'APPROVED',
        2,
        'Uygun bulundu.',
      ),
    );
  });
});
