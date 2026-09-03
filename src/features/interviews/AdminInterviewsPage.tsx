import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import {
  adminApplicationApi,
  type AdminApplication,
} from '../adminApplications/adminApplicationApi';
import { useAuth } from '../auth/authContextValue';
import { audienceListApi, type AudienceList } from '../audience/audienceListApi';
import { TurkishDateTimeInput } from '../../components/TurkishDateTimeInput';
import { formatTurkishDateTime, readTurkishDateTime } from '../../components/turkishDateTime';
import {
  interviewApi,
  type AdminInterview,
  type InterviewStatus,
  type LocationType,
} from './interviewApi';

const transitions: Partial<Record<InterviewStatus, { status: InterviewStatus; label: string }[]>> =
  {
    SCHEDULED: [
      { status: 'COMPLETED', label: 'Tamamlandı' },
      { status: 'CANCELLED', label: 'İptal et' },
      { status: 'NO_SHOW', label: 'Katılmadı' },
      { status: 'RESCHEDULED', label: 'Yeniden planlandı' },
    ],
    RESCHEDULED: [
      { status: 'SCHEDULED', label: 'Planlandı' },
      { status: 'CANCELLED', label: 'İptal et' },
    ],
  };
const statusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: 'Planlandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  NO_SHOW: 'Katılmadı',
  RESCHEDULED: 'Yeniden planlandı',
};

export function AdminInterviewsPage() {
  const { user } = useAuth();
  const [values, setValues] = useState<AdminInterview[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [lists, setLists] = useState<AudienceList[]>([]);
  const [selected, setSelected] = useState<AdminInterview | null>(null);
  const [creating, setCreating] = useState(false);
  const [locationType, setLocationType] = useState<LocationType>('ONLINE');
  const [error, setError] = useState('');

  async function load() {
    const [interviews, approved, interviewStage, audienceLists] = await Promise.all([
      interviewApi.all(),
      adminApplicationApi.list(new URLSearchParams({ status: 'APPROVED', size: '100' })),
      adminApplicationApi.list(new URLSearchParams({ status: 'INTERVIEW', size: '100' })),
      audienceListApi.all(),
    ]);
    setValues(interviews);
    setApplications([...approved.content, ...interviewStage.content]);
    setLists(audienceLists);
    setSelected((current) => interviews.find((item) => item.id === current?.id) ?? current);
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      interviewApi.all(),
      adminApplicationApi.list(new URLSearchParams({ status: 'SHORTLISTED', size: '100' })),
      adminApplicationApi.list(new URLSearchParams({ status: 'INTERVIEW', size: '100' })),
      audienceListApi.all(),
    ])
      .then(([interviews, approved, interviewStage, audienceLists]) => {
        if (!active) return;
        setValues(interviews);
        setApplications([...approved.content, ...interviewStage.content]);
        setLists(audienceLists);
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (
      !selected &&
      !String(data.get('listId') ?? '') &&
      !String(data.get('applicationId') ?? '')
    ) {
      setError('Bir liste veya öğrenci seçin.');
      return;
    }
    try {
      const body = {
        startsAt: readTurkishDateTime(data, 'startsAt'),
        endsAt: readTurkishDateTime(data, 'endsAt'),
        locationType: String(data.get('locationType')) as LocationType,
        location: String(data.get('location') ?? ''),
        meetingUrl: String(data.get('meetingUrl') ?? ''),
      };
      const listId = String(data.get('listId') ?? '');
      const saved = selected
        ? await interviewApi.update(selected, body)
        : listId
          ? (await interviewApi.createBulk(listId, body))[0]
          : await interviewApi.create(String(data.get('applicationId')), body);
      setError('');
      setCreating(false);
      setSelected(saved);
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  async function change(status: InterviewStatus) {
    if (!selected) return;
    try {
      setSelected(await interviewApi.status(selected, status));
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  async function saveFeedback(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const data = new FormData(e.currentTarget);
    const own = selected.feedback.find((item) => item.interviewerId === user?.id);
    try {
      setSelected(
        await interviewApi.feedback(
          selected,
          data.get('score') ? Number(data.get('score')) : null,
          String(data.get('notes')),
          String(data.get('recommendation')),
          own?.version,
        ),
      );
      await load();
    } catch (e) {
      setError(message(e));
    }
  }

  const editor = creating || selected;
  const ownFeedback = selected?.feedback.find((item) => item.interviewerId === user?.id);
  return (
    <section className="admin-workspace interviews-page">
      <header>
        <p className="eyebrow">Operasyon</p>
        <h1>Mülakat yönetimi</h1>
        <p>Mülakatları tek ekrandan oluşturun ve düzenleyin.</p>
      </header>
      {error && (
        <p role="alert" className="status status--error">
          {error}
        </p>
      )}
      {!editor ? (
        <section className="management-card selection-panel">
          <h2>Mülakatlar</h2>
          <div className="management-list">
            {values.length === 0 && <p>Henüz planlanmış bir mülakat yok.</p>}
            {values.map((item) => (
              <button
                className="management-list-item"
                key={item.id}
                onClick={() => {
                  setSelected(item);
                  setLocationType(item.locationType);
                }}
              >
                <span>
                  <strong>{item.studentName}</strong>
                  <small>{item.programName}</small>
                </span>
                <span>
                  <strong>{formatTurkishDateTime(item.startsAt)}</strong>
                  <small>{statusLabels[item.status]}</small>
                </span>
              </button>
            ))}
          </div>
          <button
            className="action-create"
            onClick={() => {
              setCreating(true);
              setLocationType('ONLINE');
            }}
          >
            Yeni mülakat aç
          </button>
        </section>
      ) : (
        <>
          <button
            className="secondary back-to-list"
            onClick={() => {
              setCreating(false);
              setSelected(null);
              setLocationType('ONLINE');
            }}
          >
            ← Mülakat listesine dön
          </button>
          <form
            className="management-card interview-form"
            onSubmit={save}
            key={selected?.id ?? 'new'}
          >
            <h2 className="full-width">{selected ? 'Mülakatı düzenle' : 'Yeni mülakat'}</h2>
            {!selected && (
              <>
                <label className="full-width">
                  Liste
                  <select name="listId" defaultValue="">
                    <option value="">Tek öğrenci seç</option>
                    {lists.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.name} — {value.members.length} öğrenci
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  Tek öğrenci
                  <select name="applicationId" defaultValue="">
                    <option value="">Öğrenci seçin</option>
                    {applications.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.studentName} — {item.programName}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {selected && (
              <p className="full-width record-summary">
                <strong>{selected.studentName}</strong>
                <span>{selected.programName}</span>
                <small>Başvuru ID: {selected.applicationId}</small>
              </p>
            )}
            <TurkishDateTimeInput
              name="startsAt"
              label="Başlangıç"
              defaultValue={selected?.startsAt}
            />
            <TurkishDateTimeInput name="endsAt" label="Bitiş" defaultValue={selected?.endsAt} />
            <label>
              Görüşme türü
              <select
                name="locationType"
                value={locationType}
                onChange={(event) => setLocationType(event.target.value as LocationType)}
              >
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">Yüz yüze</option>
                <option value="PHONE">Telefon</option>
              </select>
            </label>
            {locationType === 'IN_PERSON' && (
              <label>
                Konum
                <input name="location" defaultValue={selected?.location ?? ''} />
              </label>
            )}
            {locationType === 'ONLINE' && (
              <label className="full-width">
                Görüşme bağlantısı
                <input name="meetingUrl" type="url" defaultValue={selected?.meetingUrl ?? ''} />
              </label>
            )}
            <button className={selected ? 'full-width action-save' : 'full-width action-create'}>
              {selected ? 'Kaydet' : 'Mülakat oluştur'}
            </button>
          </form>
          {selected && (
            <section className="management-card">
              <h2>Durum: {statusLabels[selected.status]}</h2>
              <div className="form-actions">
                {transitions[selected.status]?.map((item) => (
                  <button key={item.status} onClick={() => void change(item.status)}>
                    {item.label}
                  </button>
                ))}
              </div>
              {selected.status === 'COMPLETED' && (
                <form className="score-form" onSubmit={saveFeedback}>
                  <h3>Mülakat notu</h3>
                  <label>
                    Puan
                    <input
                      name="score"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={ownFeedback?.score ?? ''}
                    />
                  </label>
                  <label>
                    Notlar
                    <textarea name="notes" required defaultValue={ownFeedback?.notes ?? ''} />
                  </label>
                  <label>
                    Öneri
                    <textarea
                      name="recommendation"
                      defaultValue={ownFeedback?.recommendation ?? ''}
                    />
                  </label>
                  <button>Notu kaydet</button>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}
function message(error: unknown) {
  return apiErrorMessage(error, 'Mülakat işlemi tamamlanamadı.');
}
