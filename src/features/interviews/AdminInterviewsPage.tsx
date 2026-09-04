import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import {
  adminApplicationApi,
  type AdminApplication,
} from '../adminApplications/adminApplicationApi';
import { useAuth } from '../auth/authContextValue';
import { audienceListApi, type AudienceList } from '../audience/audienceListApi';
import { TurkishDateTimeInput } from '../../components/TurkishDateTimeInput';
import { StudentDetailsButton } from '../users/StudentDetailsButton';
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
type InterviewGroup = ReturnType<typeof groupInterviews>[number];

export function AdminInterviewsPage() {
  const { user } = useAuth();
  const [values, setValues] = useState<AdminInterview[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [lists, setLists] = useState<AudienceList[]>([]);
  const [selected, setSelected] = useState<AdminInterview | null>(null);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [locationType, setLocationType] = useState<LocationType>('ONLINE');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function selectGroup(group: InterviewGroup) {
    setSelected(group.items[0]);
    setSelectedInterviewIds(group.items.map((item) => item.id));
    setLocationType(group.items[0].locationType);
  }

  function showNotice(value: string) {
    setNotice('');
    window.setTimeout(() => setNotice(value), 0);
  }

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
      const selectedInterviews = values.filter((item) => selectedInterviewIds.includes(item.id));
      const saved = selected
        ? (
            await Promise.all(
              (selectedInterviews.length ? selectedInterviews : [selected]).map((item) =>
                interviewApi.update(item, body),
              ),
            )
          )[0]
        : listId
          ? (await interviewApi.createBulk(listId, body))[0]
          : await interviewApi.create(String(data.get('applicationId')), body);
      setError('');
      setCreating(false);
      setSelected(saved);
      await load();
      showNotice(selected ? 'Mülakat güncellendi.' : 'Mülakat oluşturuldu.');
    } catch (e) {
      setError(message(e));
    }
  }
  async function change(status: InterviewStatus) {
    if (!selected) return;
    try {
      const selectedInterviews = values.filter((item) => selectedInterviewIds.includes(item.id));
      const changed = await Promise.all(
        (selectedInterviews.length ? selectedInterviews : [selected]).map((item) =>
          interviewApi.status(item, status),
        ),
      );
      setSelected(changed[0]);
      await load();
      showNotice('Mülakat durumu güncellendi.');
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
      showNotice('Mülakat notu kaydedildi.');
    } catch (e) {
      setError(message(e));
    }
  }

  const editor = creating || selected;
  const ownFeedback = selected?.feedback.find((item) => item.interviewerId === user?.id);
  const interviewGroups = groupInterviews(values);
  const selectedInterviews = values.filter((item) => selectedInterviewIds.includes(item.id));
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
      {notice && (
        <p role="status" className="status status--success">
          {notice}
        </p>
      )}
      {!editor ? (
        <section className="management-card selection-panel">
          <h2>Mülakatlar</h2>
          <div className="management-list">
            {values.length === 0 && <p>Henüz planlanmış bir mülakat yok.</p>}
            {interviewGroups.map((group) => (
              <button
                type="button"
                className="management-list-item interview-group-row"
                key={group.key}
                aria-label={`${group.programName} mülakatını düzenle`}
                onClick={() => selectGroup(group)}
              >
                <span>
                  <strong>{group.programName} mülakatı</strong>
                  <small>{group.programName}</small>
                  <small>{group.items.length} öğrenci</small>
                </span>
                <span className="interview-date-summary">
                  <strong>{formatTurkishDateTime(group.startsAt)}</strong>
                  <small>{statusLabels[group.status]}</small>
                </span>
              </button>
            ))}
          </div>
          <button
            className="action-create"
            onClick={() => {
              setCreating(true);
              setSelectedInterviewIds([]);
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
              setSelectedInterviewIds([]);
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
              <section className="full-width record-summary interview-group-summary">
                <strong>{selected.programName} mülakatı</strong>
                <span>{formatTurkishDateTime(selected.startsAt)}</span>
                <small>{Math.max(selectedInterviews.length, 1)} öğrenci</small>
                <div className="interview-participants">
                  {(selectedInterviews.length ? selectedInterviews : [selected]).map((item) => (
                    <StudentDetailsButton
                      key={item.id}
                      name={item.studentName}
                      applicationId={item.applicationId}
                    />
                  ))}
                </div>
              </section>
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
            <section className="management-card interview-status-card">
              <h2>Durum: {statusLabels[selected.status]}</h2>
              <div className="interview-status-actions">
                {transitions[selected.status]?.map((item) => (
                  <button
                    type="button"
                    className={statusActionClass(item.status)}
                    key={item.status}
                    onClick={() => void change(item.status)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {selected.status === 'COMPLETED' && selectedInterviews.length <= 1 && (
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
                  <button className="action-save">Notu kaydet</button>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}

function groupInterviews(values: AdminInterview[]) {
  const groups = new Map<string, AdminInterview[]>();
  values.forEach((item) => {
    const key = [
      item.programName,
      item.startsAt,
      item.endsAt,
      item.locationType,
      item.location ?? '',
      item.meetingUrl ?? '',
      item.status,
    ].join('|');
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return [...groups.entries()].map(([key, items]) => ({
    key,
    items,
    programName: items[0].programName,
    startsAt: items[0].startsAt,
    status: items[0].status,
  }));
}
function message(error: unknown) {
  return apiErrorMessage(error, 'Mülakat işlemi tamamlanamadı.');
}

function statusActionClass(status: InterviewStatus) {
  if (status === 'COMPLETED' || status === 'SCHEDULED') return 'action-create';
  if (status === 'CANCELLED') return 'danger';
  return 'action-update';
}
