import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { formatTurkishDateTime } from '../../components/turkishDateTime';
import { Modal } from '../../components/Modal';
import type { ApplicationStatus } from '../applications/applicationApi';
import { adminApplicationApi, type AdminDetail, type AdminPage } from './adminApplicationApi';
import { scholarshipApi, type Period, type Program } from '../scholarship/scholarshipApi';
import { ProgramListContent } from '../scholarship/ProgramLifecycle';
import { latestProgramPeriod } from '../scholarship/programPeriod';
import { adminUserApi, type AdminUser } from '../users/adminUserApi';
import { StudentDetailsButton } from '../users/StudentDetailsButton';
const statuses: { value: ApplicationStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Beklemede' },
  { value: 'MISSING_DOCUMENT', label: 'Eksik belge' },
  { value: 'APPROVED', label: 'Olumlu' },
  { value: 'REJECTED', label: 'Olumsuz' },
];
export function AdminApplicationsPage() {
  const [query, setQuery] = useSearchParams();
  const [page, setPage] = useState<AdminPage | null>(null);
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programPeriods, setProgramPeriods] = useState<Record<string, Period | null>>({});
  const [loadedAt] = useState(() => Date.now());
  const [applicant, setApplicant] = useState<AdminUser | null>(null);
  const [notice, setNotice] = useState('');
  const [decisionStatus, setDecisionStatus] = useState<ApplicationStatus>('SUBMITTED');
  const [decisionReason, setDecisionReason] = useState('');
  useEffect(() => {
    scholarshipApi
      .programs()
      .then(async (values) => {
        setPrograms(values);
        const entries = await Promise.all(
          values.map(
            async (program) =>
              [program.id, latestProgramPeriod(await scholarshipApi.periods(program.id))] as const,
          ),
        );
        setProgramPeriods(Object.fromEntries(entries));
      })
      .catch((value) => setError(message(value)));
  }, []);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(query);
    if (!params.has('page')) params.set('page', '0');
    if (!params.has('size')) params.set('size', '20');
    if (!params.has('sort')) params.set('sort', 'createdAt');
    if (!params.has('direction')) params.set('direction', 'desc');
    if (!params.has('programId')) {
      return;
    }
    adminApplicationApi
      .list(params)
      .then((value) => {
        if (active) {
          setPage(value);
          setLoading(false);
        }
      })
      .catch((value) => {
        if (active) {
          setError(message(value));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [query]);
  async function open(id: string) {
    setError('');
    try {
      const application = await adminApplicationApi.detail(id);
      const student = await adminUserApi.get(application.application.studentUserId);
      setDetail(application);
      setApplicant(student);
      setDecisionStatus(businessStatus(application.application.status));
      setDecisionReason(currentDecisionReason(application));
    } catch (value) {
      setError(message(value));
    }
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['programId', 'search', 'status', 'sort', 'direction']) {
      const value = String(data.get(key) ?? '');
      if (value) next.set(key, value);
    }
    next.set('page', '0');
    next.set('size', '20');
    setQuery(next);
  }
  async function inspectDocument(id: string, name: string) {
    try {
      const value = await adminApplicationApi.downloadDocument(id);
      const url = URL.createObjectURL(value);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (value) {
      setError(message(value));
    }
  }
  async function status(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    try {
      const updated = await adminApplicationApi.changeStatus(
        detail.application.id,
        decisionStatus,
        detail.application.version,
        decisionReason,
      );
      setDetail(updated);
      setDecisionStatus(businessStatus(updated.application.status));
      setDecisionReason(currentDecisionReason(updated) || decisionReason);
      setError('');
      showNotice('Başvuru sonucu ve gerekçesi güncellendi.');
      setPage(await adminApplicationApi.list(query));
    } catch (value) {
      setError(message(value));
    }
  }
  function showNotice(value: string) {
    setNotice('');
    window.setTimeout(() => setNotice(value), 0);
  }
  if (loading) return <p role="status">Başvurular yükleniyor…</p>;
  return (
    <section className="admin-workspace admin-applications">
      <header>
        <p className="eyebrow">Operasyon</p>
        <h1>Gelen başvurular</h1>
        <p>
          Önce programı seçin; o programa başvuran öğrencileri ve başvuru tarihlerini inceleyin.
        </p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="status status--success">
          {notice}
        </p>
      )}
      <section className="management-card application-program-picker">
        <h2>Başvuru programları</h2>
        <div className="program-choice-grid">
          {programs.map((program) => (
            <button
              type="button"
              className={`program-card ${query.get('programId') === program.id ? 'is-selected' : ''}`}
              key={program.id}
              onClick={() =>
                setQuery({
                  programId: program.id,
                  page: '0',
                  size: '20',
                  sort: 'createdAt',
                  direction: 'desc',
                })
              }
            >
              <ProgramListContent
                program={program}
                period={programPeriods[program.id]}
                now={loadedAt}
              />
            </button>
          ))}
        </div>
      </section>
      {query.has('programId') && (
        <form className="management-card application-filters" onSubmit={filter}>
          <input type="hidden" name="programId" value={query.get('programId') ?? ''} />
          <label>
            Öğrenci ara
            <input
              name="search"
              defaultValue={query.get('search') ?? ''}
              placeholder="Ad veya e-posta"
            />
          </label>
          <label>
            Durum
            <select name="status" defaultValue={query.get('status') ?? ''}>
              <option value="">Tümü</option>
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sırala
            <select name="sort" defaultValue={query.get('sort') ?? 'createdAt'}>
              <option value="createdAt">Oluşturulma</option>
              <option value="submittedAt">Gönderilme</option>
              <option value="status">Durum</option>
              <option value="completion">Tamamlanma</option>
            </select>
          </label>
          <label>
            Yön
            <select name="direction" defaultValue={query.get('direction') ?? 'desc'}>
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </label>
          <button className="action-save">Uygula</button>
        </form>
      )}
      {query.has('programId') && (
        <section className="management-card">
          <h2>Başvurular ({page?.totalElements ?? 0})</h2>
          {!page?.content.length ? (
            <p>Filtreye uygun başvuru yok.</p>
          ) : (
            <div className="admin-application-list">
              {page.content.map((value) => (
                <article className="application-row" key={value.id}>
                  <span>
                    <StudentDetailsButton name={value.studentName} userId={value.studentUserId} />
                    <small>{value.studentEmail}</small>
                  </span>
                  <span>
                    {value.programName}
                    <small>{value.periodName}</small>
                  </span>
                  <span>
                    {applicationStatusLabel(value.status)}
                    <small>
                      Başvuru: {formatDate(value.submittedAt ?? value.createdAt)} · %
                      {value.completion}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="danger detail-button"
                    onClick={() => void open(value.id)}
                  >
                    Detay
                  </button>
                </article>
              ))}
            </div>
          )}
          <div className="pagination">
            <button
              disabled={!page || page.page === 0}
              onClick={() => {
                const next = new URLSearchParams(query);
                next.set('page', String((page?.page ?? 0) - 1));
                setQuery(next);
              }}
            >
              Önceki
            </button>
            <span>
              {(page?.page ?? 0) + 1} / {Math.max(page?.totalPages ?? 1, 1)}
            </span>
            <button
              disabled={!page || page.page + 1 >= page.totalPages}
              onClick={() => {
                const next = new URLSearchParams(query);
                next.set('page', String((page?.page ?? 0) + 1));
                setQuery(next);
              }}
            >
              Sonraki
            </button>
          </div>
        </section>
      )}
      {detail && (
        <Modal title={detail.application.studentName} onClose={() => setDetail(null)}>
          <section className="application-detail modal-detail">
            <p>
              {detail.application.studentEmail} · {detail.application.programName} ·{' '}
              {applicationStatusLabel(detail.application.status)}
            </p>
            {applicant && (
              <section className="applicant-summary">
                <h3>Öğrenci bilgileri</h3>
                <dl>
                  <div>
                    <dt>TC kimlik no</dt>
                    <dd>{applicant.nationalId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Telefon</dt>
                    <dd>{applicant.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Üniversite</dt>
                    <dd>{applicant.universityName ?? applicant.otherUniversity ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Bölüm</dt>
                    <dd>{applicant.departmentName ?? applicant.otherDepartment ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Şehir</dt>
                    <dd>{applicant.city ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Not ortalaması</dt>
                    <dd>{applicant.gpa ?? '—'}</dd>
                  </div>
                </dl>
              </section>
            )}
            <h3>Cevaplar</h3>
            {detail.answers.length ? (
              <dl>
                {detail.answers.map((value) => (
                  <div key={value.fieldId}>
                    <dt>{value.label}</dt>
                    <dd>
                      {Array.isArray(value.value)
                        ? value.value.join(', ')
                        : String(value.value ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Cevap yok.</p>
            )}
            <h3>Belgeler</h3>
            {detail.documents.length ? (
              <ul>
                {detail.documents.map((value) => (
                  <li key={value.id}>
                    <span>
                      {value.requirementName}: {value.originalName}
                    </span>
                    <button
                      type="button"
                      className="action-update"
                      onClick={() => void inspectDocument(value.id, value.originalName)}
                    >
                      İncele
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Belge yok.</p>
            )}
            <form className="modal-form modal-form--decision" onSubmit={status}>
              <label>
                Başvuru sonucu
                <select
                  name="status"
                  required
                  value={decisionStatus}
                  onChange={(event) => setDecisionStatus(event.target.value as ApplicationStatus)}
                >
                  <option value="SUBMITTED">Beklemede</option>
                  <option value="MISSING_DOCUMENT">Eksik belge</option>
                  <option value="APPROVED">Olumlu</option>
                  <option value="REJECTED">Olumsuz</option>
                </select>
              </label>
              <label>
                Gerekçe
                <textarea
                  name="reason"
                  maxLength={500}
                  required
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                />
              </label>
              <button className="action-update">Durumu güncelle</button>
            </form>
          </section>
        </Modal>
      )}
    </section>
  );
}
function message(error: unknown) {
  return apiErrorMessage(error, 'Gelen başvuru işlemi tamamlanamadı.');
}

function businessStatus(status: ApplicationStatus): ApplicationStatus {
  if (status === 'MISSING_DOCUMENT' || status === 'APPROVED' || status === 'REJECTED')
    return status;
  return 'SUBMITTED';
}

function currentDecisionReason(detail: AdminDetail) {
  const status = businessStatus(detail.application.status);
  return detail.history.find((item) => businessStatus(item.newStatus) === status)?.reason ?? '';
}

function formatDate(value: string) {
  return formatTurkishDateTime(value);
}

function applicationStatusLabel(status: ApplicationStatus) {
  if (status === 'APPROVED') return 'Olumlu';
  if (status === 'REJECTED') return 'Olumsuz';
  if (status === 'MISSING_DOCUMENT') return 'Eksik belge';
  if (status === 'WITHDRAWN') return 'Olumsuz';
  return 'Beklemede';
}
