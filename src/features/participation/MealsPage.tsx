import { useEffect, useState } from 'react';
import {
  participationApi,
  type MealWeek,
  type MealWeekSummary,
  type Page,
} from './participationApi';
import { mealDate, participationError } from './participationPresentation';
import { ParticipationDialog } from './ParticipationDialog';
import { MealWeekForm } from './MealWeekForm';
import { Pagination, Participants } from './ParticipationShared';

export function MealsPage({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [weeks, setWeeks] = useState<Page<MealWeekSummary> | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weekBusy, setWeekBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    participationApi
      .weeks(admin, page)
      .then((value) => {
        if (active) setWeeks(value);
      })
      .catch((error) => {
        if (active) setError(participationError(error));
      });
    return () => {
      active = false;
    };
  }, [admin, page, reload]);
  const weekId = selectedWeek || weeks?.content[0]?.id;
  return (
    <section className="portal-workspace participation-workspace">
      <header>
        <p className="eyebrow">{admin ? 'Yönetim' : 'Öğrenci portalı'}</p>
        <h1>Yemekler</h1>
        <p>
          {admin
            ? 'Haftalık yemek günlerini açın ve gün bazında katılımcıları görüntüleyin.'
            : 'Geleceğiniz günleri seçip en alttaki Kaydet/Güncelle düğmesiyle onaylayın. Haftalık özet e-posta adresinize gönderilir.'}
        </p>
      </header>
      {admin && (
        <div className="participation-toolbar">
          <button type="button" className="action-create" onClick={() => setCreating(true)}>
            Yeni yemek haftası aç
          </button>
        </div>
      )}
      {creating && (
        <ParticipationDialog title="Yeni yemek haftası" onClose={() => setCreating(false)}>
          <MealWeekForm
            onCancel={() => setCreating(false)}
            onCreated={(week) => {
              setCreating(false);
              setSelectedWeek(week.id);
              setReload((value) => value + 1);
            }}
          />
        </ParticipationDialog>
      )}
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      {!weeks && !error && <p role="status">Yemek haftaları yükleniyor…</p>}
      {weeks && (
        <>
          {weeks.content.length === 0 ? (
            <p>Henüz yemek haftası açılmadı.</p>
          ) : (
            <label className="participation-week-select">
              Yemek haftası
              <select
                disabled={weekBusy}
                value={weekId}
                onChange={(event) => setSelectedWeek(event.target.value)}
              >
                {selectedWeek && !weeks.content.some((week) => week.id === selectedWeek) && (
                  <option value={selectedWeek}>Seçilen hafta</option>
                )}
                {weeks.content.map((week) => (
                  <option key={week.id} value={week.id}>
                    {mealDate(week.weekStart)} haftası
                  </option>
                ))}
              </select>
            </label>
          )}
          <Pagination
            page={page}
            totalPages={weeks.totalPages}
            disabled={weekBusy}
            onChange={(value) => {
              setPage(value);
              setWeeks(null);
              setSelectedWeek('');
            }}
          />
        </>
      )}
      {weekId && (
        <MealWeekDetails
          key={`${weekId}-${admin}`}
          id={weekId}
          admin={admin}
          onBusy={setWeekBusy}
        />
      )}
    </section>
  );
}

function MealWeekDetails({
  id,
  admin,
  onBusy,
}: {
  id: string;
  admin: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [week, setWeek] = useState<MealWeek | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [participantDay, setParticipantDay] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    participationApi
      .week(admin, id)
      .then((value) => {
        if (active) {
          setWeek(value);
          setSelected(value.days.filter((day) => day.attending).map((day) => day.id));
        }
      })
      .catch((error) => {
        if (active) setError(participationError(error));
      });
    return () => {
      active = false;
    };
  }, [admin, id, reload]);
  const dirty = week?.days.some((day) => day.attending !== selected.includes(day.id)) ?? false;
  useEffect(() => {
    onBusy(dirty || saving);
  }, [dirty, saving, onBusy]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    if (!week || saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await participationApi.saveMeals(id, selected, week.version);
      setWeek({
        ...week,
        version: result.version,
        days: week.days.map((day) => ({ ...day, attending: selected.includes(day.id) })),
      });
      setSuccess(
        result.changed
          ? 'Seçimleriniz kaydedildi. Haftalık özet e-posta ile gönderilecek.'
          : 'Seçimleriniz zaten güncel.',
      );
    } catch (error) {
      setError(participationError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && (
        <div role="alert" className="status status--error">
          {error}{' '}
          <button
            type="button"
            className="participation-secondary"
            disabled={saving}
            onClick={() => {
              setWeek(null);
              setError('');
              setReload((value) => value + 1);
            }}
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
      {!week && !error && <p role="status">Yemek günleri yükleniyor…</p>}
      {week && (
        <section className="management-card">
          <div className="participation-card-header">
            <h2>{mealDate(week.weekStart)} haftası</h2>
            {admin && (
              <button type="button" className="action-update" onClick={() => setEditing(true)}>
                Haftayı düzenle
              </button>
            )}
          </div>
          <p>Kayıt ve iptal, yemek gününün başlangıcına kadar yapılabilir (Türkiye saati).</p>
          <div className="participation-list">
            {week.days.map((day) => (
              <article key={day.id}>
                <div>
                  <h3>{mealDate(day.date!)}</h3>
                  {!day.registrationOpen && <span>Kayıt süresi doldu</span>}
                </div>
                {admin ? (
                  <button
                    type="button"
                    className="participation-secondary"
                    aria-label={`${mealDate(day.date!)} katılımcıları`}
                    onClick={() => setParticipantDay(day.id)}
                  >
                    Katılımcılar
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-pressed={selected.includes(day.id)}
                    aria-label={`${mealDate(day.date!)}: Geleceğim`}
                    disabled={saving || !day.registrationOpen}
                    onClick={() => {
                      setSuccess('');
                      setSelected((values) =>
                        values.includes(day.id)
                          ? values.filter((id) => id !== day.id)
                          : [...values, day.id],
                      );
                    }}
                  >
                    {selected.includes(day.id) ? '✓ Geleceğim' : 'Geleceğim'}
                  </button>
                )}
              </article>
            ))}
          </div>
          {!admin && (
            <div className="participation-save">
              <p>
                {dirty
                  ? 'Kaydedilmemiş seçimleriniz var. Seçili bir güne tekrar basarak katılımınızı kaldırabilirsiniz.'
                  : `${selected.length} gün için kayıtlısınız.`}
              </p>
              <button
                className={week.version > 0 ? 'action-update' : 'action-save'}
                type="button"
                disabled={saving || !dirty}
                onClick={() => void save()}
              >
                {saving ? 'Kaydediliyor…' : week.version > 0 ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          )}
        </section>
      )}
      {admin && editing && week && (
        <ParticipationDialog
          title="Yemek haftasını düzenle"
          onClose={() => {
            setEditing(false);
            setReload((value) => value + 1);
          }}
        >
          <MealWeekForm
            week={week}
            onCancel={() => setEditing(false)}
            onCreated={(value) => {
              setWeek(value);
              setEditing(false);
              setSuccess('Yemek haftası güncellendi.');
            }}
          />
        </ParticipationDialog>
      )}
      {admin && participantDay && week && (
        <ParticipationDialog title="Yemek katılımcıları" onClose={() => setParticipantDay('')}>
          <label className="participation-day-filter">
            Yemek günü
            <select
              value={participantDay}
              onChange={(event) => setParticipantDay(event.target.value)}
            >
              {week.days.map((day) => (
                <option key={day.id} value={day.id}>
                  {mealDate(day.date!)}
                </option>
              ))}
            </select>
          </label>
          <Participants
            key={participantDay}
            id={participantDay}
            title={mealDate(week.days.find((day) => day.id === participantDay)!.date!)}
          />
        </ParticipationDialog>
      )}
    </>
  );
}
