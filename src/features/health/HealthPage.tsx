import { useEffect, useState } from 'react';
import { getHealth, type HealthResponse } from './healthApi';

type HealthState =
  { status: 'loading' } | { status: 'success'; data: HealthResponse } | { status: 'error' };

export function HealthPage() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    getHealth()
      .then((data) => {
        if (active) setHealth({ status: 'success', data });
      })
      .catch(() => {
        if (active) setHealth({ status: 'error' });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card" aria-labelledby="page-title">
      <p className="eyebrow">Turing Scholarship</p>
      <h1 id="page-title">Başvuru yönetiminin temeli hazır.</h1>
      {health.status === 'loading' && <p role="status">API bağlantısı kontrol ediliyor…</p>}
      {health.status === 'success' && (
        <p role="status" className="status status--success">
          API çalışıyor · PostgreSQL {health.data.database === 'up' ? 'bağlı' : 'erişilemiyor'}
        </p>
      )}
      {health.status === 'error' && (
        <p role="alert" className="status status--error">
          API bağlantısı kurulamadı. Backend servisinin çalıştığını kontrol edin.
        </p>
      )}
    </section>
  );
}
