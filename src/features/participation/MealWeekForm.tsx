import { useState, type FormEvent } from 'react';
import { TurkishDateInput } from '../../components/TurkishDateInput';
import { participationApi, type MealWeek } from './participationApi';
import { isoDate, mealDate, parseDate, participationError } from './participationPresentation';

export function MealWeekForm({
  week,
  onCreated,
  onCancel,
}: {
  week?: MealWeek;
  onCreated: (week: MealWeek) => void;
  onCancel?: () => void;
}) {
  const next = new Date();
  next.setDate(next.getDate() + ((8 - next.getDay()) % 7 || 7));
  const initial = week
    ? week.weekStart.split('-').reverse().join('/')
    : `${String(next.getDate()).padStart(2, '0')}/${String(next.getMonth() + 1).padStart(2, '0')}/${next.getFullYear()}`;
  const [start, setStart] = useState(initial);
  const [selected, setSelected] = useState(() =>
    Array.from({ length: 7 }, (_, i) =>
      week
        ? week.days.some(
            (day) => day.date === isoDate(new Date(parseDate(initial).getTime() + i * 86400000)),
          )
        : i < 5,
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  let dates: string[] = [];
  try {
    const date = parseDate(start);
    if (date.getDay() === 1)
      dates = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(date);
        day.setDate(day.getDate() + index);
        return isoDate(day);
      });
  } catch {
    /* Wait for a complete date. */
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || dates.length !== 7) return;
    setSaving(true);
    setError('');
    try {
      const days = dates.flatMap((date, i) => (selected[i] ? [{ date }] : []));
      const saved = week
        ? await participationApi.updateWeek(week, days)
        : await participationApi.createWeek({ weekStart: dates[0], days });
      onCreated(saved);
    } catch (error) {
      setError(participationError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="management-card participation-form" onSubmit={(event) => void submit(event)}>
      <h2>{week ? 'Yemek haftasını düzenle' : 'Yeni yemek haftası'}</h2>
      <p>Yemek verilecek günleri seçin.</p>
      <fieldset disabled={saving} className="participation-fields">
        {week ? (
          <p className="participation-week-label">{mealDate(week.weekStart)} haftası</p>
        ) : (
          <div className="participation-date-field">
            <label htmlFor="meal-week-start">Hafta başlangıcı (pazartesi)</label>
            <TurkishDateInput id="meal-week-start" value={start} onChange={setStart} required />
          </div>
        )}
        {dates.length === 0 && <p>Pazartesi gününe ait geçerli bir tarih girin.</p>}
        <div className="meal-days-grid">
          {dates.map((date, index) => (
            <label className="meal-day-choice" key={date}>
              <span>{mealDate(date)}</span>
              <input
                type="checkbox"
                checked={selected[index]}
                disabled={week?.days.some((day) => day.date === date && !day.registrationOpen)}
                onChange={(event) =>
                  setSelected((values) =>
                    values.map((value, i) => (i === index ? event.target.checked : value)),
                  )
                }
              />
            </label>
          ))}
        </div>
        {week && (
          <p className="participation-help">
            Katılımcısı olan günler kaldırılamaz. Geçmiş günlerin kayıtları korunur.
          </p>
        )}
        <div className="participation-actions">
          {onCancel && (
            <button type="button" className="participation-secondary" onClick={onCancel}>
              Vazgeç
            </button>
          )}
          <button
            type="submit"
            className={week ? 'action-update' : 'action-save'}
            disabled={dates.length === 0 || !selected.some(Boolean)}
          >
            {saving ? 'Kaydediliyor…' : week ? 'Güncelle' : 'Kaydet'}
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
