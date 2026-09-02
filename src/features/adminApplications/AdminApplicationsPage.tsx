import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ApplicationStatus } from '../applications/applicationApi';
import { adminApplicationApi, type AdminDetail, type AdminPage } from './adminApplicationApi';
const statuses: ApplicationStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'MISSING_DOCUMENT',
  'SHORTLISTED',
  'INTERVIEW',
  'APPROVED',
  'REJECTED',
  'WAITLISTED',
  'WITHDRAWN',
];
const transitions: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: ['UNDER_REVIEW', 'MISSING_DOCUMENT'],
  MISSING_DOCUMENT: ['REJECTED'],
  UNDER_REVIEW: ['MISSING_DOCUMENT', 'SHORTLISTED', 'REJECTED', 'WAITLISTED'],
  SHORTLISTED: ['INTERVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED'],
  INTERVIEW: ['APPROVED', 'REJECTED', 'WAITLISTED'],
  WAITLISTED: ['APPROVED', 'REJECTED'],
};
export function AdminApplicationsPage() {
  const [query, setQuery] = useSearchParams();
  const [page, setPage] = useState<AdminPage | null>(null);
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(query);
    if (!params.has('page')) params.set('page', '0');
    if (!params.has('size')) params.set('size', '20');
    if (!params.has('sort')) params.set('sort', 'createdAt');
    if (!params.has('direction')) params.set('direction', 'desc');
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
      setDetail(await adminApplicationApi.detail(id));
    } catch (value) {
      setError(message(value));
    }
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['search', 'status', 'sort', 'direction']) {
      const value = String(data.get(key) ?? '');
      if (value) next.set(key, value);
    }
    next.set('page', '0');
    next.set('size', '20');
    setQuery(next);
  }
  async function note(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await adminApplicationApi.addNote(detail.application.id, String(data.get('content')));
      setDetail(await adminApplicationApi.detail(detail.application.id));
      form.reset();
    } catch (value) {
      setError(message(value));
    }
  }
  async function status(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const data = new FormData(event.currentTarget);
    try {
      setDetail(
        await adminApplicationApi.changeStatus(
          detail.application.id,
          String(data.get('status')) as ApplicationStatus,
          detail.application.version,
          String(data.get('reason')),
        ),
      );
      setPage(await adminApplicationApi.list(query));
    } catch (value) {
      setError(message(value));
    }
  }
  if (loading) return <p role="status">Başvurular yükleniyor…</p>;
  return (
    <section className="admin-workspace admin-applications">
      <header>
        <p className="eyebrow">Operasyon</p>
        <h1>Başvuru yönetimi</h1>
        <p>Başvuruları filtreleyin, inceleyin ve durum geçmişini yönetin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <form className="management-card application-filters" onSubmit={filter}>
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
            {statuses.map((value) => (
              <option key={value}>{value}</option>
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
        <button>Uygula</button>
      </form>
      <section className="management-card">
        <h2>Başvurular ({page?.totalElements ?? 0})</h2>
        {!page?.content.length ? (
          <p>Filtreye uygun başvuru yok.</p>
        ) : (
          <div className="admin-application-list">
            {page.content.map((value) => (
              <button
                className="application-row"
                key={value.id}
                onClick={() => void open(value.id)}
              >
                <span>
                  <strong>{value.studentName}</strong>
                  <small>{value.studentEmail}</small>
                </span>
                <span>
                  {value.programName}
                  <small>{value.periodName}</small>
                </span>
                <span>
                  {value.status}
                  <small>%{value.completion}</small>
                </span>
              </button>
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
      {detail && (
        <section className="application-detail management-card">
          <h2>{detail.application.studentName}</h2>
          <p>
            {detail.application.studentEmail} · {detail.application.programName} ·{' '}
            {detail.application.status}
          </p>
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
                  {value.requirementName}: {value.originalName}
                </li>
              ))}
            </ul>
          ) : (
            <p>Belge yok.</p>
          )}
          <form onSubmit={note}>
            <label>
              Internal not
              <textarea name="content" maxLength={2000} required />
            </label>
            <button>Not ekle</button>
          </form>
          <ul>
            {detail.notes.map((value) => (
              <li key={value.id}>
                <strong>{value.adminName}</strong>: {value.content}
              </li>
            ))}
          </ul>
          {(transitions[detail.application.status]?.length ?? 0) > 0 && (
            <form onSubmit={status}>
              <label>
                Yeni durum
                <select name="status" required>
                  {transitions[detail.application.status]?.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Gerekçe
                <textarea name="reason" maxLength={500} required />
              </label>
              <button>Durumu güncelle</button>
            </form>
          )}
          <h3>Durum geçmişi</h3>
          <ul>
            {detail.history.map((value, index) => (
              <li key={`${value.createdAt}-${index}`}>
                {value.oldStatus ?? '—'} → {value.newStatus} · {value.changedBy}
                {value.reason && ` · ${value.reason}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
function message(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data?.message ?? 'İşlem tamamlanamadı.')
    : 'İşlem tamamlanamadı.';
}
