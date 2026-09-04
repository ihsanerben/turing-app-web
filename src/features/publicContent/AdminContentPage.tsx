import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { adminContentApi } from './adminContentApi';
import type { Announcement } from './publicContentApi';
import { AdminAppConfigPanel } from '../appConfig/AdminAppConfigPanel';
import { toSlug } from '../../components/slug';
export function AdminContentPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
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
      updating = Boolean(editingAnnouncement),
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
      showNotice(updating ? 'Duyuru güncellendi.' : 'Duyuru oluşturuldu.');
    } catch (x) {
      setError(message(x));
    }
  }
  async function announcementAction(v: Announcement, kind: 'publish' | 'archiveAnnouncement') {
    try {
      await adminContentApi[kind](v);
      await load();
      showNotice(kind === 'publish' ? 'Duyuru yayınlandı.' : 'Duyuru arşive alındı.');
    } catch (e) {
      setError(message(e));
    }
  }
  async function restore(v: Announcement) {
    try {
      const restored = await adminContentApi.restoreAnnouncement(v);
      setEditingAnnouncement(restored);
      await load();
      showNotice('Duyuru arşivden çıkarıldı.');
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
      showNotice('Duyuru silindi.');
    } catch (e) {
      setError(message(e));
    }
  }
  function showNotice(value: string) {
    setNotice('');
    window.setTimeout(() => setNotice(value), 0);
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
      {notice && (
        <p role="status" className="status status--success">
          {notice}
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
          <AnnouncementIdentityFields announcement={editingAnnouncement} />
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
                    <button className="action-update" onClick={() => setEditingAnnouncement(v)}>
                      Düzenle
                    </button>
                    <button
                      className="action-create"
                      onClick={() => void announcementAction(v, 'publish')}
                    >
                      Yayınla
                    </button>
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
              <button className="action-update" onClick={() => void restore(v)}>
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

function AnnouncementIdentityFields({ announcement }: { announcement: Announcement | null }) {
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [slug, setSlug] = useState(announcement?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(Boolean(announcement));
  return (
    <>
      <label>
        Başlık
        <input
          name="title"
          value={title}
          onChange={(event) => {
            const value = event.target.value;
            setTitle(value);
            if (!slugEdited) setSlug(toSlug(value));
          }}
          required
        />
      </label>
      <label>
        URL adı
        <input
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={slug}
          onChange={(event) => {
            setSlug(toSlug(event.target.value));
            setSlugEdited(true);
          }}
          required
        />
        <small>Başlıktan otomatik hazırlanır; gerekirse değiştirebilirsiniz.</small>
      </label>
    </>
  );
}
