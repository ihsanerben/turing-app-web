import type { Application, ApplicationStatus } from '../applications/applicationApi';
import type { InterviewStatus } from '../interviews/interviewApi';

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  DRAFT: 'Beklemede',
  SUBMITTED: 'Beklemede',
  UNDER_REVIEW: 'Beklemede',
  MISSING_DOCUMENT: 'Eksik belge',
  SHORTLISTED: 'Beklemede',
  INTERVIEW: 'Beklemede',
  APPROVED: 'Olumlu',
  REJECTED: 'Olumsuz',
  WAITLISTED: 'Beklemede',
  WITHDRAWN: 'Olumsuz',
};

const interviewStatusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: 'Planlandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  NO_SHOW: 'Katılım olmadı',
  RESCHEDULED: 'Yeniden planlandı',
};

export function applicationStatusLabel(status: ApplicationStatus) {
  return applicationStatusLabels[status];
}

export function interviewStatusLabel(status: InterviewStatus) {
  return interviewStatusLabels[status];
}

export function applicationAction(application: Application) {
  if (application.status === 'DRAFT') return 'Başvuruya devam et';
  if (application.status === 'SUBMITTED') return 'Başvuruyu düzenle';
  if (application.status === 'MISSING_DOCUMENT') return 'Belgeleri tamamla';
  return 'Başvuruyu görüntüle';
}

export function applicationStatusTone(status: ApplicationStatus) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED' || status === 'WITHDRAWN') return 'neutral';
  if (status === 'MISSING_DOCUMENT') return 'warning';
  return 'info';
}

export function applicationStatusGroup(status: ApplicationStatus) {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED' || status === 'WITHDRAWN') return 'REJECTED';
  if (status === 'MISSING_DOCUMENT') return 'MISSING_DOCUMENT';
  return 'SUBMITTED';
}
