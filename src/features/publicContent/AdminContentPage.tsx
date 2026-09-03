import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { adminContentApi } from './adminContentApi';
import type { Announcement } from './publicContentApi';
import { AdminAppConfigPanel } from '../appConfig/AdminAppConfigPanel';
export function AdminContentPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState('');
  async function load() {
    setAnnouncements(await adminContentApi.announcements());
  }
  useEffect(() => {
    let active = true;
    adminContentApi
      .announcements()
      .then((a) => {
        if (active) {
          setAnnouncements(a);
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, []);
  async function saveAnnouncement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form),
      body = {
        title: d.get('title'),
        slug: d.get('slug'),
        summary: d.get('summary'),
        content: d.get('content'),
      };
    try {
      if (editingAnnouncement) await adminContentApi.updateAnnouncement(editingAnnouncement, body);
      else await adminContentApi.createAnnouncement(body);
      setEditingAnnouncement(null);
      form.reset();
      await load();
    } catch (x) {
      setError(message(x));
    }
  }
  async function announcementAction(v: Announcement, kind: 'publish' | 'archiveAnnouncement') {
    try {
      await adminContentApi[kind](v);
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  async function restore(v: Announcement) {
    try {
      const restored = await adminContentApi.restoreAnnouncement(v);
      setEditingAnnouncement(restored);
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  async function remove(v: Announcement) {
    if (!window.confirm(`“${v.title}” duyurusu silinsin mi?`)) return;
    try {
      await adminContentApi.deleteAnnouncement(v);
      if (editingAnnouncement?.id === v.id) setEditingAnnouncement(null);
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  const active = announcements.filter((v) => v.status !== 'ARCHIVED');
  const archived = announcements.filter((v) => v.status === 'ARCHIVED');
  return (
    <section className="admin-workspace content-admin">
      <header>
        <p className="eyebrow">İçerik</p>
        <h1>İçerik yönetimi</h1>
        <p>Duyuruları oluşturun, yayınlayın ve arşivleyin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      <AdminAppConfigPanel />
      <div className="content-grid">
        <form
          className="management-card"
          key={editingAnnouncement?.id ?? 'new-announcement'}
          onSubmit={saveAnnouncement}
        >
          <h2>{editingAnnouncement ? 'Duyuruyu düzenle' : 'Yeni duyuru'}</h2>
          <label>
            Başlık
            <input name="title" defaultValue={editingAnnouncement?.title ?? ''} required />
          </label>
          <label>
            URL adı
            <input
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={editingAnnouncement?.slug ?? ''}
              required
            />
          </label>
          <label>
            Özet
            <textarea name="summary" defaultValue={editingAnnouncement?.summary ?? ''} required />
          </label>
          <label>
            İçerik
            <textarea
              name="content"
              rows={8}
              defaultValue={editingAnnouncement?.content ?? ''}
              required
            />
          </label>
          <div className="form-actions">
            {editingAnnouncement && (
              <button
                type="button"
                className="secondary"
                onClick={() => setEditingAnnouncement(null)}
              >
                Vazgeç
              </button>
            )}
            <button className={editingAnnouncement ? 'action-update' : 'action-create'}>
              {editingAnnouncement ? 'Güncelle' : 'Duyuru oluştur'}
            </button>
          </div>
        </form>
        <section className="management-card">
          <h2>Duyurular</h2>
          {active.length === 0 && <p>Henüz aktif bir duyuru yok.</p>}
          {active.map((v) => (
            <article className="content-row" key={v.id}>
              <div>
                <strong>{v.title}</strong>
                <span>{v.status === 'DRAFT' ? 'Taslak' : 'Yayında'}</span>
              </div>
              <div>
                {v.status === 'DRAFT' && (
                  <>
                    <button className="secondary" onClick={() => setEditingAnnouncement(v)}>
                      Düzenle
                    </button>
                    <button onClick={() => void announcementAction(v, 'publish')}>Yayınla</button>
                  </>
                )}
                {v.status !== 'ARCHIVED' && (
                  <button
                    className="danger"
                    onClick={() => void announcementAction(v, 'archiveAnnouncement')}
                  >
                    Arşivle
                  </button>
                )}
                <button className="danger" onClick={() => void remove(v)}>
                  Sil
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
      <section className="management-card content-archive">
        <h2>Arşiv</h2>
        {archived.length === 0 && <p>Arşivde duyuru yok.</p>}
        {archived.map((v) => (
          <article className="content-row" key={v.id}>
            <div>
              <strong>{v.title}</strong>
              <span>Arşivde</span>
            </div>
            <div>
              <button className="secondary" onClick={() => void restore(v)}>
                Arşivden çıkar ve düzenle
              </button>
              <button className="danger" onClick={() => void remove(v)}>
                Sil
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
function message(e: unknown) {
  return apiErrorMessage(e, 'İçerik işlemi tamamlanamadı.');
}
