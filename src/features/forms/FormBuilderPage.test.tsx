import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormBuilderPage } from './FormBuilderPage';
import { formApi, type FormDefinition } from './formApi';
import { documentApi } from '../documents/documentApi';

vi.mock('./formApi', () => ({
  formApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    publish: vi.fn(),
    newVersion: vi.fn(),
  },
}));
vi.mock('../documents/documentApi', () => ({
  documentApi: {
    adminRequirements: vi.fn(),
    createRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    deleteRequirement: vi.fn(),
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const published: FormDefinition = {
  id: 'form-1',
  periodId: 'period-1',
  name: 'Başvuru Formu',
  versionNumber: 1,
  status: 'PUBLISHED',
  publishedAt: '2026-09-02T00:00:00Z',
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
          key: 'family_income',
          label: 'Aile geliri',
          type: 'DECIMAL',
          required: true,
          order: 0,
          placeholder: null,
          requirementId: null,
          validationRules: { min: 0 },
          options: [],
        },
      ],
    },
  ],
};
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/forms/period-1']}>
      <Routes>
        <Route path="/admin/forms/:periodId" element={<FormBuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
describe('FormBuilderPage', () => {
  it('shows immutable published schema and version action', async () => {
    vi.mocked(formApi.list).mockResolvedValue([published]);
    vi.mocked(formApi.get).mockResolvedValue(published);
    vi.mocked(documentApi.adminRequirements).mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'Başvuru formunu hazırla' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Aile geliri *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yeni versiyon oluştur' })).toBeEnabled();
  });

  it('keeps a successfully created document requirement without reloading the list', async () => {
    vi.mocked(formApi.list).mockResolvedValue([]);
    vi.mocked(documentApi.adminRequirements).mockResolvedValue([]);
    vi.mocked(documentApi.createRequirement).mockResolvedValue({
      id: 'requirement-1',
      periodId: 'period-1',
      name: 'Öğrenci belgesi',
      description: null,
      required: true,
      allowedMimeTypes: ['application/pdf'],
      maxSizeBytes: 5 * 1024 * 1024,
      order: 0,
    });
    renderPage();

    fireEvent.change(await screen.findByRole('textbox', { name: 'Ad' }), {
      target: { value: 'Öğrenci belgesi' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Zorunlu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Belge ekle' }));

    expect(await screen.findByText('Belge gereksinimi oluşturuldu.')).toBeInTheDocument();
    expect(screen.getByText('Öğrenci belgesi')).toBeInTheDocument();
    await waitFor(() => expect(documentApi.createRequirement).toHaveBeenCalledOnce());
    expect(documentApi.adminRequirements).toHaveBeenCalledOnce();
  });
});
