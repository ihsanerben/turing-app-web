import { useEffect, useState } from 'react';
import { participationApi, type Activity, type Events } from './participationApi';
import { eventDate, participationError } from './participationPresentation';
import { ParticipationDialog } from './ParticipationDialog';
import { EventForm } from './EventForm';
import { Pagination, Participants } from './ParticipationShared';

export function EventsPage({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<Events | null>(null);
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);
  const [participantEvent, setParticipantEvent] = useState('');
  const dirty = Object.keys(changes).length > 0;
  useEffect(() => {
    let active = true;
    participationApi
      .events(admin, page)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch((error) => {
        if (active) setError(participationError(error));
      });
    return () => {
      active = false;
    };
  }, [admin, page, reload]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    if (!result || saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await participationApi.saveEvents(
        Object.entries(changes).map(([eventId, attending]) => ({ eventId, attending })),
        result.version,
      );
      setResult({
        ...result,
        version: saved.version,
        events: {
          ...result.events,
          content: result.events.content.map((event) => ({
            ...event,
            attending: changes[event.id] ?? event.attending,
          })),
        },
      });
      setChanges({});
      setSuccess(
        saved.changed
          ? 'Katılım seçimleriniz kaydedildi. Özet e-posta ile gönderilecek.'
          : 'Seçimleriniz zaten güncel.',
      );
    } catch (error) {
      setError(participationError(error));
    } finally {
      setSaving(false);
    }
  }

  function refresh() {
    setResult(null);
    setChanges({});
    setError('');
    setParticipantEvent('');
    setReload((value) => value + 1);
  }

  return (
    <section className="portal-workspace participation-workspace">
      <header>
        <p className="eyebrow">{admin ? 'Yönetim' : 'Öğrenci portalı'}</p>
        <h1>Etkinlikler</h1>
        <p>
          {admin
            ? 'Etkinlik oluşturun ve katılan öğrencileri görüntüleyin.'
            : 'Katılmak istediğiniz etkinlikleri seçip en alttaki Kaydet/Güncelle düğmesiyle onaylayın. Katılım özetiniz e-posta ile gönderilir.'}
        </p>
      </header>
      {admin && (
        <div className="participation-toolbar">
          <button type="button" className="action-create" onClick={() => setCreating(true)}>
            Yeni etkinlik aç
          </button>
        </div>
      )}
      {creating && (
        <ParticipationDialog title="Yeni etkinlik" onClose={() => setCreating(false)}>
          <EventForm
            onCancel={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              setPage(0);
              refresh();
              setSuccess('Etkinlik oluşturuldu.');
            }}
          />
        </ParticipationDialog>
      )}
      {error && (
        <div role="alert" className="status status--error">
          {error}{' '}
          <button
            type="button"
            className="participation-secondary"
            disabled={saving}
            onClick={refresh}
          >
            Güncel kayıtları yükle
          </button>
        </div>
      )}
      {success && (
        <p role="status" className="status status--success">
          {success}
        </p>
      )}
      {!result && !error && <p role="status">Etkinlikler yükleniyor…</p>}
      {result && (
        <section className="management-card">
          <h2>Etkinlik listesi</h2>
          <p>Kayıt ve iptal, etkinlik başlayana kadar yapılabilir. Saatler Türkiye saatidir.</p>
          {result.events.content.length === 0 ? (
            <p>Henüz etkinlik oluşturulmadı.</p>
          ) : (
            <div className="participation-list">
              {result.events.content.map((event) => (
                <article key={event.id}>
                  <div>
                    <h3>{event.title}</h3>
                    <time dateTime={event.startsAt!}>{eventDate(event.startsAt!)}</time>
                    {event.location && <p>{event.location}</p>}
                    <p className="participation-description">{event.description}</p>
                    {!event.registrationOpen && <span>Kayıt süresi doldu</span>}
                  </div>
                  {admin ? (
                    <div className="participation-row-actions">
                      <button
                        type="button"
                        className="participation-secondary"
                        aria-label={`${event.title} katılımcıları`}
                        onClick={() => setParticipantEvent(event.id)}
                      >
                        Katılımcılar
                      </button>
                      <button
                        type="button"
                        className="action-update"
                        disabled={!event.registrationOpen}
                        aria-label={`${event.title} düzenle`}
                        onClick={() => setEditing(event)}
                      >
                        Düzenle
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`${event.title}: Katılacağım`}
                      aria-pressed={changes[event.id] ?? event.attending}
                      disabled={saving || !event.registrationOpen}
                      onClick={() => {
                        setSuccess('');
                        setChanges((values) => {
                          const next = { ...values };
                          const attending = !(values[event.id] ?? event.attending);
                          if (attending === event.attending) delete next[event.id];
                          else next[event.id] = attending;
                          return next;
                        });
                      }}
                    >
                      {(changes[event.id] ?? event.attending) ? '✓ Katılacağım' : 'Katılacağım'}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          {!admin && result.events.content.length > 0 && (
            <div className="participation-save">
              <p>
                {dirty
                  ? 'Kaydedilmemiş seçimleriniz var. Seçili etkinliğe tekrar basarak katılımınızı kaldırabilirsiniz.'
                  : 'Seçimleriniz güncel.'}
              </p>
              <button
                className={result.version > 0 ? 'action-update' : 'action-save'}
                type="button"
                disabled={saving || !dirty}
                onClick={() => void save()}
              >
                {saving ? 'Kaydediliyor…' : result.version > 0 ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={result.events.totalPages}
            disabled={saving || dirty}
            onChange={(value) => {
              setResult(null);
              setPage(value);
              setParticipantEvent('');
              setError('');
              setSuccess('');
            }}
          />
        </section>
      )}
      {admin && editing && (
        <ParticipationDialog
          title="Etkinliği düzenle"
          onClose={() => {
            setEditing(null);
            refresh();
          }}
        >
          <EventForm
            event={editing}
            onCancel={() => setEditing(null)}
            onCreated={() => {
              setEditing(null);
              refresh();
              setSuccess('Etkinlik güncellendi.');
            }}
          />
        </ParticipationDialog>
      )}
      {admin && participantEvent && result && (
        <ParticipationDialog title="Etkinlik katılımcıları" onClose={() => setParticipantEvent('')}>
          <Participants
            key={participantEvent}
            id={participantEvent}
            title={result.events.content.find((event) => event.id === participantEvent)!.title}
          />
        </ParticipationDialog>
      )}
    </section>
  );
}
