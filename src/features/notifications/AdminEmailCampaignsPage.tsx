/* eslint-disable react-hooks/set-state-in-effect */
import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { notificationApi, type CampaignDetail, type CampaignSummary } from './notificationApi';
export function AdminEmailCampaignsPage() {
  const [values, setValues] = useState<CampaignSummary[]>([]);
  const [selected, setSelected] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      setValues(await notificationApi.campaigns());
      setError('');
    } catch (e) {
      setError(message(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form),
      ids = String(d.get('userIds'))
        .split(/[\s,]+/)
        .map((v) => v.trim())
        .filter(Boolean);
    try {
      const result = await notificationApi.create(
        String(d.get('subject')),
        String(d.get('body')),
        ids,
      );
      setSelected(result);
      form.reset();
      await load();
    } catch (x) {
      setError(message(x));
    }
  }
  async function open(id: string) {
    try {
      setSelected(await notificationApi.campaign(id));
    } catch (e) {
      setError(message(e));
    }
  }
  async function action(kind: 'send' | 'retry') {
    if (!selected) return;
    try {
      setSelected(await notificationApi[kind](selected));
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <section className="admin-workspace email-page">
      <header>
        <p className="eyebrow">İletişim</p>
        <h1>E-posta kampanyaları</h1>
        <p>Tek veya çoklu alıcıya arka planda, ayrı adresler üzerinden e-posta gönderin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <div className="email-grid">
        <form className="management-card" onSubmit={create}>
          <h2>Yeni kampanya</h2>
          <label>
            Konu
            <input name="subject" maxLength={200} required />
          </label>
          <label>
            Mesaj
            <textarea name="body" rows={8} maxLength={10000} required />
          </label>
          <label>
            Alıcı kullanıcı ID’leri
            <textarea
              name="userIds"
              rows={5}
              placeholder="Virgül veya yeni satırla ayırın"
              required
            />
          </label>
          <button>Taslak oluştur</button>
        </form>
        <section className="management-card">
          <h2>Kampanyalar</h2>
          {values.length === 0 ? (
            <p>Henüz kampanya yok.</p>
          ) : (
            <div className="campaign-list">
              {values.map((v) => (
                <button key={v.id} onClick={() => void open(v.id)}>
                  <strong>{v.subject}</strong>
                  <span>
                    {v.status} · {v.sentCount}/{v.recipientCount} gönderildi · {v.failedCount}{' '}
                    başarısız
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      {selected && (
        <section className="management-card campaign-detail">
          <h2>{selected.subject}</h2>
          <p>{selected.body}</p>
          <p>
            <strong>Durum:</strong> {selected.status}
          </p>
          <div className="interview-actions">
            {selected.status === 'DRAFT' && (
              <button onClick={() => void action('send')}>Gönderimi başlat</button>
            )}
            {selected.status === 'COMPLETED' &&
              selected.recipients.some((r) => r.status === 'FAILED') && (
                <button onClick={() => void action('retry')}>Başarısızları tekrar dene</button>
              )}
            <button className="secondary" onClick={() => void open(selected.id)}>
              Sonuçları yenile
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Alıcı</th>
                <th>Durum</th>
                <th>Deneme</th>
                <th>Hata</th>
              </tr>
            </thead>
            <tbody>
              {selected.recipients.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>{r.status}</td>
                  <td>{r.attemptCount}</td>
                  <td>{r.failureMessage ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}
function message(e: unknown) {
  return axios.isAxiosError(e)
    ? (e.response?.data?.message ?? 'İşlem tamamlanamadı.')
    : 'İşlem tamamlanamadı.';
}
