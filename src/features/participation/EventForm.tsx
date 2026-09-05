import { useState, type FormEvent } from 'react';
import { TurkishDateTimeInput } from '../../components/TurkishDateTimeInput';
import { participationApi, type Activity } from './participationApi';
import { parseDate, isoDate, participationError } from './participationPresentation';

export function EventForm({
  event: existing,
  onCreated,
  onCancel,
}: {
  event?: Activity;
  onCreated: () => void;
  onCancel?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      const date = isoDate(parseDate(String(data.get('startsAtDate'))));
      const time = String(data.get('startsAtTime'));
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Geçerli bir saat girin.');
      const body = {
        title: String(data.get('title')),
        description: String(data.get('description')),
        location: String(data.get('location')),
        startsAt: new Date(`${date}T${time}:00+03:00`).toISOString(),
      };
      if (existing) await participationApi.updateEvent(existing, body);
      else await participationApi.createEvent(body);
      onCreated();
    } catch (error) {
      setError(participationError(error));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="management-card participation-form" onSubmit={(event) => void submit(event)}>
      <h2>{existing ? 'Etkinliği düzenle' : 'Yeni etkinlik'}</h2>
      <fieldset disabled={saving} className="participation-fields">
        <label>
          Etkinlik adı
          <input name="title" defaultValue={existing?.title} required maxLength={200} />
        </label>
        <label>
          Açıklama
          <textarea name="description" defaultValue={existing?.description} maxLength={3000} />
        </label>
        <TurkishDateTimeInput
          name="startsAt"
          label="Başlangıç (Türkiye saati)"
          defaultValue={
            existing?.startsAt
              ? new Date(new Date(existing.startsAt).getTime() + 3 * 3600000)
                  .toISOString()
                  .slice(0, 19)
              : ''
          }
        />
        <label>
          Konum (isteğe bağlı)
          <input name="location" defaultValue={existing?.location} maxLength={500} />
        </label>
        <div className="participation-actions">
          {onCancel && (
            <button type="button" className="participation-secondary" onClick={onCancel}>
              Vazgeç
            </button>
          )}
          <button className={existing ? 'action-update' : 'action-save'} type="submit">
            {saving ? 'Kaydediliyor…' : existing ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
    </form>
  );
}
