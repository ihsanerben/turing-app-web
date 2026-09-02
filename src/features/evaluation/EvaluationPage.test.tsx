import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EvaluationPage } from './EvaluationPage';
import { evaluationApi } from './evaluationApi';
import { scholarshipApi } from '../scholarship/scholarshipApi';
vi.mock('./evaluationApi', () => ({
  evaluationApi: {
    criteria: vi.fn(),
    createCriterion: vi.fn(),
    updateCriterion: vi.fn(),
    deleteCriterion: vi.fn(),
    evaluation: vi.fn(),
    score: vi.fn(),
    ranking: vi.fn(),
  },
}));
vi.mock('../scholarship/scholarshipApi', () => ({
  scholarshipApi: { programs: vi.fn(), periods: vi.fn() },
}));
describe('EvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(scholarshipApi.programs).mockResolvedValue([
      { id: 'p1', name: 'Başarı Bursu', slug: 'basari', description: '', active: true, version: 0 },
    ]);
    vi.mocked(scholarshipApi.periods).mockResolvedValue([
      {
        id: 'period-1',
        programId: 'p1',
        programName: 'Başarı Bursu',
        name: '2026',
        academicYear: '2026-2027',
        startsAt: '',
        endsAt: '',
        status: 'EVALUATION',
        maxRecipients: null,
        allowWithdrawal: true,
        version: 4,
      },
    ]);
    vi.mocked(evaluationApi.criteria).mockResolvedValue([
      {
        id: 'c1',
        periodId: 'period-1',
        name: 'Akademik başarı',
        description: null,
        maxScore: 10,
        weight: 60,
        displayOrder: 0,
        version: 0,
      },
    ]);
    vi.mocked(evaluationApi.ranking).mockResolvedValue([
      {
        rank: 1,
        applicationId: 'a1',
        studentName: 'Ada Lovelace',
        studentEmail: 'ada@example.com',
        weightedTotal: 82.5,
      },
    ]);
  });
  it('shows criteria and ranking and opens scoring form', async () => {
    vi.mocked(evaluationApi.evaluation).mockResolvedValue({
      applicationId: 'a1',
      weightedTotal: 82.5,
      scores: [],
    });
    render(<EvaluationPage />);
    expect(await screen.findByRole('heading', { name: 'Değerlendirme' })).toBeInTheDocument();
    expect(await screen.findByText(/Akademik başarı/)).toBeInTheDocument();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Başvuru ID'), { target: { value: 'a1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Başvuruyu aç' }));
    await waitFor(() => expect(evaluationApi.evaluation).toHaveBeenCalledWith('a1'));
    expect(await screen.findByLabelText('Puan (0–10)')).toBeInTheDocument();
  });
});
