import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationFormPage } from './ApplicationFormPage';
import { applicationApi } from './applicationApi';
import { documentApi } from '../documents/documentApi';

vi.mock('./applicationApi', () => ({
  applicationApi: { form: vi.fn(), save: vi.fn(), submit: vi.fn(), withdraw: vi.fn() },
}));
vi.mock('../documents/documentApi', () => ({
  documentApi: {
    requirements: vi.fn(),
    files: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
    download: vi.fn(),
  },
}));
describe('ApplicationFormPage', () => {
  it('renders pinned dynamic schema and saved answers', async () => {
    vi.mocked(applicationApi.form).mockResolvedValue({
      application: {
        id: 'app-1',
        periodId: 'period-1',
        periodName: '2026',
        programName: 'Başarı Bursu',
        formId: 'form-1',
        formVersion: 1,
        status: 'DRAFT',
        completion: 50,
        submittedAt: null,
        createdAt: '',
        version: 1,
      },
      form: {
        id: 'form-1',
        periodId: 'period-1',
        name: 'Başvuru Formu',
        versionNumber: 1,
        status: 'PUBLISHED',
        publishedAt: '',
        version: 2,
        sections: [
          {
            id: 'section-1',
            title: 'Ekonomik Bilgiler',
            description: null,
            order: 0,
            fields: [
              {
                id: 'field-1',
                key: 'motivation',
                label: 'Motivasyon',
                type: 'TEXTAREA',
                required: true,
                order: 0,
                placeholder: null,
                requirementId: null,
                validationRules: { minLength: 10 },
                options: [],
              },
            ],
          },
        ],
      },
      answers: [{ fieldId: 'field-1', value: 'Topluma katkı' }],
    });
    vi.mocked(documentApi.requirements).mockResolvedValue([]);
    vi.mocked(documentApi.files).mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/portal/applications/app-1/form']}>
        <Routes>
          <Route path="/portal/applications/:id/form" element={<ApplicationFormPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Başvuru Formu' })).toBeInTheDocument();
    expect(screen.getByLabelText('Motivasyon *')).toHaveValue('Topluma katkı');
    expect(screen.getByRole('button', { name: 'Kaydet ve gönder' })).toBeEnabled();
  });

  it('allows a submitted application to be edited', async () => {
    vi.mocked(applicationApi.form).mockResolvedValue({
      application: {
        id: 'app-2',
        periodId: 'period-1',
        periodName: '2026',
        programName: 'Başarı Programı',
        formId: 'form-1',
        formVersion: 1,
        status: 'SUBMITTED',
        completion: 100,
        submittedAt: '2026-09-03T10:00:00Z',
        createdAt: '',
        version: 2,
      },
      form: {
        id: 'form-1',
        periodId: 'period-1',
        name: 'Başvuru Formu',
        versionNumber: 1,
        status: 'PUBLISHED',
        publishedAt: '',
        version: 2,
        sections: [
          {
            id: 'section-1',
            title: 'Bilgiler',
            description: null,
            order: 0,
            fields: [
              {
                id: 'field-1',
                key: 'motivation',
                label: 'Motivasyon',
                type: 'TEXTAREA',
                required: true,
                order: 0,
                placeholder: null,
                requirementId: null,
                validationRules: {},
                options: [],
              },
            ],
          },
        ],
      },
      answers: [{ fieldId: 'field-1', value: 'İlk cevap' }],
    });
    vi.mocked(documentApi.requirements).mockResolvedValue([]);
    vi.mocked(documentApi.files).mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/portal/applications/app-2/form']}>
        <Routes>
          <Route path="/portal/applications/:id/form" element={<ApplicationFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText('Motivasyon *')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Başvurumu güncelle' })).toBeEnabled();
  });
});
