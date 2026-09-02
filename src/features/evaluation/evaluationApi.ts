import { apiClient } from '../../api/apiClient';

export type Criterion = {
  id: string;
  periodId: string;
  name: string;
  description: string | null;
  maxScore: number;
  weight: number;
  displayOrder: number;
  version: number;
};
export type EvaluationScore = {
  id: string;
  criterionId: string;
  criterionName: string;
  maxScore: number;
  weight: number;
  reviewerId: string;
  reviewerName: string;
  score: number;
  comment: string | null;
  version: number;
};
export type ApplicationEvaluation = {
  applicationId: string;
  weightedTotal: number | null;
  scores: EvaluationScore[];
};
export type Ranking = {
  rank: number;
  applicationId: string;
  studentName: string;
  studentEmail: string;
  weightedTotal: number | null;
};
export type CriterionInput = {
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
  version?: number;
};

export const evaluationApi = {
  criteria: (periodId: string) =>
    apiClient
      .get<Criterion[]>(`/api/admin/application-periods/${periodId}/evaluation-criteria`)
      .then((r) => r.data),
  createCriterion: (periodId: string, body: CriterionInput) =>
    apiClient
      .post<Criterion>(`/api/admin/application-periods/${periodId}/evaluation-criteria`, body)
      .then((r) => r.data),
  updateCriterion: (criterion: Criterion, body: CriterionInput) =>
    apiClient
      .put<Criterion>(`/api/admin/evaluation-criteria/${criterion.id}`, {
        ...body,
        version: criterion.version,
      })
      .then((r) => r.data),
  deleteCriterion: (criterion: Criterion) =>
    apiClient.delete(`/api/admin/evaluation-criteria/${criterion.id}`, {
      params: { version: criterion.version },
    }),
  evaluation: (applicationId: string) =>
    apiClient
      .get<ApplicationEvaluation>(`/api/admin/applications/${applicationId}/evaluation`)
      .then((r) => r.data),
  score: (
    applicationId: string,
    criterionId: string,
    score: number,
    comment: string,
    version?: number,
  ) =>
    apiClient
      .put<ApplicationEvaluation>(
        `/api/admin/applications/${applicationId}/evaluation-scores/${criterionId}`,
        { score, comment, version },
      )
      .then((r) => r.data),
  ranking: (periodId: string) =>
    apiClient
      .get<Ranking[]>(`/api/admin/application-periods/${periodId}/ranking`)
      .then((r) => r.data),
};
