import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/authContextValue';
import {
  interviewApi,
  type AdminInterview,
  type InterviewStatus,
  type LocationType,
} from './interviewApi';
const transitions: Partial<Record<InterviewStatus, InterviewStatus[]>> = {
  SCHEDULED: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
  RESCHEDULED: ['SCHEDULED', 'CANCELLED'],
};
export function AdminInterviewsPage() {
  const { user } = useAuth();
  const [applicationId, setApplicationId] = useState('');
  const [values, setValues] = useState<AdminInterview[]>([]);
  const [editing, setEditing] = useState<AdminInterview | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      setValues(await interviewApi.byApplication(applicationId));
      setError('');
    } catch (e) {
      setError(message(e));
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form),
      body = {
        startsAt: new Date(String(d.get('startsAt'))).toISOString(),
        endsAt: new Date(String(d.get('endsAt'))).toISOString(),
        locationType: String(d.get('locationType')) as LocationType,
        location: String(d.get('location')),
        meetingUrl: String(d.get('meetingUrl')),
      };
    try {
      if (editing) await interviewApi.update(editing, body);
      else await interviewApi.create(applicationId, body);
      setEditing(null);
      form.reset();
      await load();
    } catch (x) {
      setError(message(x));
    }
  }
  async function change(v: AdminInterview, status: InterviewStatus) {
    try {
      await interviewApi.status(v, status);
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  async function feedback(e: FormEvent<HTMLFormElement>, v: AdminInterview) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      own = v.feedback.find((x) => x.interviewerId === user?.id);
    try {
      await interviewApi.feedback(
        v,
        d.get('score') ? Number(d.get('score')) : null,
        String(d.get('notes')),
        String(d.get('recommendation')),
        own?.version,
      );
      await load();
    } catch (x) {
      setError(message(x));
    }
  }
  return (
    <section className="admin-workspace interviews-page">
      <header>
        <p className="eyebrow">Operasyon</p>
        <h1>Mülakat yönetimi</h1>
        <p>Mülakatları planlayın; feedback yalnız adminlere görünür.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <section className="management-card">
        <form
          className="application-lookup"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <label>
            Başvuru ID
            <input
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              required
            />
          </label>
          <button>Başvuruyu aç</button>
        </form>
      </section>
      {applicationId && (
        <form className="management-card interview-form" onSubmit={save} key={editing?.id ?? 'new'}>
          <h2>{editing ? 'Mülakatı düzenle' : 'Mülakat planla'}</h2>
          <label>
            Başlangıç
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={editing ? local(editing.startsAt) : ''}
            />
          </label>
          <label>
            Bitiş
            <input
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={editing ? local(editing.endsAt) : ''}
            />
          </label>
          <label>
            Tür
            <select name="locationType" defaultValue={editing?.locationType ?? 'ONLINE'}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">Yüz yüze</option>
              <option value="PHONE">Telefon</option>
            </select>
          </label>
          <label>
            Konum
            <input name="location" defaultValue={editing?.location ?? ''} />
          </label>
          <label>
            Bağlantı
            <input name="meetingUrl" type="url" defaultValue={editing?.meetingUrl ?? ''} />
          </label>
          <button>{editing ? 'Güncelle' : 'Planla'}</button>
        </form>
      )}
      {values.map((v) => {
        const own = v.feedback.find((x) => x.interviewerId === user?.id);
        return (
          <article className="management-card interview-card" key={v.id}>
            <h2>{new Date(v.startsAt).toLocaleString('tr-TR')}</h2>
            <p>
              {v.status} · {v.locationType}
            </p>
            {(v.status === 'SCHEDULED' || v.status === 'RESCHEDULED') && (
              <button onClick={() => setEditing(v)}>Planı düzenle</button>
            )}
            <div className="interview-actions">
              {transitions[v.status]?.map((s) => (
                <button key={s} onClick={() => void change(v, s)}>
                  {s}
                </button>
              ))}
            </div>
            {v.status === 'COMPLETED' && (
              <form className="score-form" onSubmit={(e) => void feedback(e, v)}>
                <h3>Internal feedback</h3>
                <label>
                  Puan
                  <input
                    name="score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={own?.score ?? ''}
                  />
                </label>
                <label>
                  Notlar
                  <textarea name="notes" required defaultValue={own?.notes ?? ''} />
                </label>
                <label>
                  Öneri
                  <textarea name="recommendation" defaultValue={own?.recommendation ?? ''} />
                </label>
                <button>Feedback kaydet</button>
              </form>
            )}
          </article>
        );
      })}
    </section>
  );
}
function local(v: string) {
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function message(e: unknown) {
  return axios.isAxiosError(e)
    ? (e.response?.data?.message ?? 'İşlem tamamlanamadı.')
    : 'İşlem tamamlanamadı.';
}
