/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { notificationApi, type CampaignDetail, type CampaignSummary } from './notificationApi';
import { audienceListApi, type AudienceList } from '../audience/audienceListApi';
import { Modal } from '../../components/Modal';
export function AdminEmailCampaignsPage() {
  const [values, setValues] = useState<CampaignSummary[]>([]);
  const [selected, setSelected] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState('');
  const [lists, setLists] = useState<AudienceList[]>([]);
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
    audienceListApi
      .all()
      .then(setLists)
      .catch((e) => setError(message(e)));
  }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form),
      attachment = d.get('attachment'),
      list = lists.find((value) => value.id === String(d.get('listId'))),
      ids = list?.members.map((value) => value.userId) ?? [];
    try {
      const result = await notificationApi.create(
        String(d.get('subject')),
        String(d.get('body')),
        ids,
        attachment instanceof File && attachment.size ? attachment : undefined,
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
            Başlık
            <input name="subject" maxLength={200} required />
          </label>
          <label>
            Mesaj
            <textarea name="body" rows={8} maxLength={10000} required />
          </label>
          <label>
            Alıcı listesi
            <select name="listId" required defaultValue="">
              <option value="" disabled>
                Liste seçin
              </option>
              {lists.map((value) => (
                <option key={value.id} value={value.id}>
                  {value.name} — {value.members.length} öğrenci
                </option>
              ))}
            </select>
          </label>
          <label>
            Dosya eki (isteğe bağlı, en fazla 10 MB)
            <input name="attachment" type="file" />
          </label>
          <button className="action-create">Taslak oluştur</button>
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
        <Modal title={selected.subject} onClose={() => setSelected(null)}>
          <section className="campaign-detail">
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
        </Modal>
      )}
    </section>
  );
}
function message(e: unknown) {
  return apiErrorMessage(e, 'E-posta işlemi tamamlanamadı.');
}
