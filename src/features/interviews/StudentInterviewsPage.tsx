import axios from 'axios';
import { useEffect, useState } from 'react';
import { interviewApi, type StudentInterview } from './interviewApi';
import { interviewStatusLabel } from '../portal/portalPresentation';
import { formatTurkishDateTime } from '../../components/turkishDateTime';
export function StudentInterviewsPage() {
  const [values, setValues] = useState<StudentInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    interviewApi
      .mine()
      .then((v) => {
        if (active) {
          setValues(v);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(message(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  if (loading) return <p role="status">Mülakatlar yükleniyor…</p>;
  return (
    <section className="portal-workspace">
      <header>
        <p className="eyebrow">Öğrenci portalı</p>
        <h1>Mülakatlarım</h1>
        <p>Planlanan mülakatlarınızın tarih ve katılım bilgilerini görüntüleyin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <section className="management-card">
        <h2>Mülakat takvimi</h2>
        {values.length === 0 ? (
          <p>Planlanmış mülakatınız yok.</p>
        ) : (
          <div className="interview-list">
            {values.map((v) => (
              <article key={v.id}>
                <div>
                  <strong>{v.programName}</strong>
                  <span>
                    {v.periodName} · {interviewStatusLabel(v.status)}
                  </span>
                </div>
                <div>
                  <time dateTime={v.startsAt}>{formatTurkishDateTime(v.startsAt)}</time>
                  <span>
                    {v.locationType === 'ONLINE' && v.meetingUrl ? (
                      <a href={v.meetingUrl} target="_blank" rel="noreferrer">
                        Mülakata katıl
                      </a>
                    ) : (
                      (v.location ?? (v.locationType === 'PHONE' ? 'Telefon görüşmesi' : '—'))
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
function message(e: unknown) {
  return axios.isAxiosError(e)
    ? (e.response?.data?.message ?? 'Mülakatlar yüklenemedi.')
    : 'Mülakatlar yüklenemedi.';
}
