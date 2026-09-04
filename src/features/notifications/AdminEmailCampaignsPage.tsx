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
  const [notice, setNotice] = useState('');
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
        list?.id ?? '',
        list?.name ?? '',
        attachment instanceof File && attachment.size ? attachment : undefined,
      );
      setSelected(result);
      form.reset();
      await load();
      showNotice('E-posta kampanyası oluşturuldu.');
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
      showNotice(
        kind === 'send'
          ? 'E-posta gönderimi başlatıldı.'
          : 'Başarısız gönderimler yeniden başlatıldı.',
      );
    } catch (e) {
      setError(message(e));
    }
  }
  function showNotice(value: string) {
    setNotice('');
    window.setTimeout(() => setNotice(value), 0);
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
      {notice && (
        <p role="status" className="status status--success">
          {notice}
        </p>
      )}
      <div className="email-grid">
        <form className="management-card email-composer" onSubmit={create}>
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
          <button className="action-create">Kampanya oluştur</button>
        </form>
        <section className="management-card campaign-history">
          <h2>Kampanyalar</h2>
          {values.length === 0 ? (
            <p>Henüz kampanya yok.</p>
          ) : (
            <div className="campaign-list">
              {values.map((v) => (
                <button key={v.id} onClick={() => void open(v.id)}>
                  <strong>{v.subject}</strong>
                  <span>
                    {campaignStatus(v.status)} · {v.sentCount}/{v.recipientCount} gönderildi ·{' '}
                    {v.failedCount} başarısız
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
            <dl className="detail-grid campaign-detail-grid">
              <div>
                <dt>Başlık</dt>
                <dd>{selected.subject}</dd>
              </div>
              <div>
                <dt>Gönderilen liste</dt>
                <dd>{selected.audienceListName ?? 'Liste bilgisi bulunmuyor'}</dd>
              </div>
              <div>
                <dt>Dosya</dt>
                <dd>{selected.attachmentName ?? 'Dosya eklenmedi'}</dd>
              </div>
              <div>
                <dt>Durum</dt>
                <dd>{campaignStatus(selected.status)}</dd>
              </div>
              <div className="full-width">
                <dt>İçerik</dt>
                <dd className="campaign-message">{selected.body}</dd>
              </div>
            </dl>
            <div className="interview-actions">
              {selected.status === 'DRAFT' && (
                <button className="action-create" onClick={() => void action('send')}>
                  Gönderimi başlat
                </button>
              )}
              {selected.status === 'COMPLETED' &&
                selected.recipients.some((r) => r.status === 'FAILED') && (
                  <button className="action-update" onClick={() => void action('retry')}>
                    Başarısızları tekrar dene
                  </button>
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
                    <td>{recipientStatus(r.status)}</td>
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

function campaignStatus(status: string) {
  if (status === 'DRAFT') return 'Gönderilmeye hazır';
  if (status === 'SENDING') return 'Gönderiliyor';
  return 'Tamamlandı';
}

function recipientStatus(status: string) {
  if (status === 'PENDING') return 'Bekliyor';
  if (status === 'SENT') return 'Gönderildi';
  return 'Başarısız';
}
