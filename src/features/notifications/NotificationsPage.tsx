import axios from 'axios';
import { useEffect, useState } from 'react';
import { notificationApi, type Notification } from './notificationApi';
import { formatTurkishDateTime } from '../../components/turkishDateTime';
export function NotificationsPage() {
  const [values, setValues] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    notificationApi
      .mine()
      .then(setValues)
      .catch((e) => setError(message(e)))
      .finally(() => setLoading(false));
  }, []);
  async function read(value: Notification) {
    if (value.readAt) return;
    try {
      const updated = await notificationApi.read(value.id);
      setValues((current) => current.map((v) => (v.id === updated.id ? updated : v)));
    } catch (e) {
      setError(message(e));
    }
  }
  if (loading) return <p role="status">Bildirimler yükleniyor…</p>;
  return (
    <section className="portal-workspace">
      <header>
        <p className="eyebrow">Öğrenci portalı</p>
        <h1>Bildirimlerim</h1>
        <p>Başvuru ve mülakatlarınızdaki önemli gelişmeleri takip edin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <section className="management-card notification-list">
        {values.length === 0 ? (
          <p>Henüz bildiriminiz yok.</p>
        ) : (
          values.map((v) => (
            <article key={v.id} className={v.readAt ? '' : 'unread'}>
              <div>
                <strong>{v.title}</strong>
                <p>{v.message}</p>
                <time dateTime={v.createdAt}>{formatTurkishDateTime(v.createdAt)}</time>
              </div>
              {!v.readAt && <button onClick={() => void read(v)}>Okundu işaretle</button>}
            </article>
          ))
        )}
      </section>
    </section>
  );
}
function message(e: unknown) {
  return axios.isAxiosError(e)
    ? (e.response?.data?.message ?? 'Bildirimler yüklenemedi.')
    : 'Bildirimler yüklenemedi.';
}
