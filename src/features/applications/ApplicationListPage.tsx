import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { applicationApi, type Application } from './applicationApi';
import {
  applicationAction,
  applicationStatusLabel,
  applicationStatusTone,
} from '../portal/portalPresentation';

export function ApplicationListPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    applicationApi
      .list()
      .then((apps) => {
        if (active) {
          setApplications(apps);
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
  }, []);
  if (loading) return <p role="status">Başvurular yükleniyor…</p>;
  return (
    <section className="portal-workspace">
      <header>
        <p className="eyebrow">Öğrenci portalı</p>
        <h1>Başvurularım</h1>
        <p>Başlattığınız başvuruları ve güncel durumlarını takip edin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <section className="management-card">
        <h2>Mevcut başvurular</h2>
        {applications.length === 0 ? (
          <p>Henüz başvurunuz yok.</p>
        ) : (
          <div className="application-list">
            {applications.map((value) => (
              <article key={value.id}>
                <div>
                  <strong>{value.programName}</strong>
                  <span>
                    {value.periodName} ·{' '}
                    <span
                      className={`status-badge status-badge--${applicationStatusTone(value.status)}`}
                    >
                      {applicationStatusLabel(value.status)}
                    </span>
                  </span>
                  <progress
                    aria-label={`${value.programName} tamamlanma oranı`}
                    max="100"
                    value={value.completion}
                  />
                </div>
                <Link className="button-link" to={`/portal/applications/${value.id}/form`}>
                  {applicationAction(value)}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
function message(error: unknown) {
  return apiErrorMessage(error, 'Başvurular yüklenemedi.');
}
