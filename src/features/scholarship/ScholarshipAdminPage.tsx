import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { FormBuilderPage } from '../forms/FormBuilderPage';
import { TurkishDateTimeInput } from '../../components/TurkishDateTimeInput';
import { readTurkishDateTime } from '../../components/turkishDateTime';
import { scholarshipApi, type Period, type Program } from './scholarshipApi';
import { formApi, type FieldType, type FormField } from '../forms/formApi';
import { documentApi } from '../documents/documentApi';

export function ScholarshipAdminPage() {
  const [loadedAt] = useState(() => Date.now());
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [creating, setCreating] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [error, setError] = useState('');
  const [programName, setProgramName] = useState('');
  const [programSlug, setProgramSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [notice, setNotice] = useState('');
  const [programPeriods, setProgramPeriods] = useState<Record<string, Period | null>>({});
  const programFormRef = useRef<HTMLFormElement>(null);
  const periodFormRef = useRef<HTMLFormElement>(null);
  const loadPrograms = () =>
    scholarshipApi.programs().then(async (values) => {
      const activePrograms = values.filter((program) => program.active);
      setPrograms(activePrograms);
      const entries = await Promise.all(
        activePrograms.map(async (program) => {
          const programValues = await scholarshipApi.periods(program.id);
          const current =
            [...programValues].sort(
              (left, right) => new Date(right.endsAt).getTime() - new Date(left.endsAt).getTime(),
            )[0] ?? null;
          return [program.id, current] as const;
        }),
      );
      setProgramPeriods(Object.fromEntries(entries));
    });
  useEffect(() => {
    loadPrograms().catch((reason) => setError(apiErrorMessage(reason, 'Programlar yüklenemedi.')));
  }, []);
  useEffect(() => {
    if (!selected) {
      return;
    }
    scholarshipApi
      .periods(selected)
      .then((values) => {
        const sorted = [...values].sort(
          (left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
        );
        setPeriods(sorted);
        setSelectedPeriod((current) => current || sorted[0]?.id || '');
      })
      .catch((reason) => setError(apiErrorMessage(reason, 'Başvuru dönemleri yüklenemedi.')));
  }, [selected]);
  async function createProgram(
    event: FormEvent<HTMLFormElement>,
    questions: DraftQuestion[],
    documents: DraftDocument[],
    publish: boolean,
  ) {
    event.preventDefault();
    const programForm = event.currentTarget;
    setError('');
    if (publish && questions.length === 0) {
      setError('Programı yayınlamak için en az bir soru ekleyin.');
      return;
    }
    const data = new FormData(event.currentTarget);
    try {
      const created = await scholarshipApi.createProgram({
        name: String(data.get('name')),
        slug: String(data.get('slug')),
        description: String(data.get('description')),
      });
      const startsAt = readTurkishDateTime(data, 'startsAt');
      const endsAt = readTurkishDateTime(data, 'endsAt');
      const start = new Date(startsAt);
      const period = await scholarshipApi.createPeriod({
        programId: created.id,
        name: created.name,
        academicYear: academicYear(start),
        startsAt,
        endsAt,
        maxRecipients: Number(data.get('maxRecipients')) || null,
        allowWithdrawal: true,
      });
      const definition = await formApi.create(period.id, 'Başvuru Soruları');
      const savedForm = await formApi.save({
        ...definition,
        sections: questions.length
          ? [{ title: 'Başvuru soruları', description: null, fields: questions.map(toFormField) }]
          : [],
      });
      for (const [index, document] of documents.entries()) {
        await documentApi.createRequirement(period.id, {
          name: document.name,
          description: document.description || null,
          required: document.required,
          allowedMimeTypes: document.allowedMimeTypes,
          maxSizeBytes: document.maxSizeMb * 1024 * 1024,
          order: index,
        });
      }
      let finalPeriod = period;
      if (publish) {
        await formApi.publish(savedForm);
        finalPeriod = await scholarshipApi.transition(
          period,
          new Date(period.startsAt).getTime() > Date.now() ? 'SCHEDULED' : 'OPEN',
        );
      }
      programForm.reset();
      setProgramName('');
      setProgramSlug('');
      setSlugEdited(false);
      setPrograms((values) => [...values, created]);
      setSelected(created.id);
      setPeriods([finalPeriod]);
      setSelectedPeriod(period.id);
      setCreating(false);
      setProgramPeriods((values) => ({ ...values, [created.id]: finalPeriod }));
      setNotice(
        publish ? 'Program kaydedildi ve yayınlandı.' : 'Program taslak olarak kaydedildi.',
      );
    } catch (e) {
      setError(apiErrorMessage(e, 'Program oluşturulamadı.'));
    }
  }
  async function createPeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const created = await scholarshipApi.createPeriod({
        programId: selected,
        name: data.get('name'),
        academicYear: data.get('academicYear'),
        startsAt: readTurkishDateTime(data, 'startsAt'),
        endsAt: readTurkishDateTime(data, 'endsAt'),
        maxRecipients: Number(data.get('maxRecipients')) || null,
        allowWithdrawal: true,
      });
      event.currentTarget.reset();
      setPeriods((values) =>
        [created, ...values].sort(
          (left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
        ),
      );
      setSelectedPeriod(created.id);
    } catch (e) {
      setError(apiErrorMessage(e, 'Başvuru dönemi oluşturulamadı.'));
    }
  }

  async function updateProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = programs.find((program) => program.id === selected);
    if (!current) return;
    const data = new FormData(event.currentTarget);
    setError('');
    try {
      const updated = await scholarshipApi.updateProgram(current, {
        name: String(data.get('name')),
        slug: String(data.get('slug')),
        description: String(data.get('description')),
      });
      setPrograms((values) =>
        values.map((program) => (program.id === updated.id ? updated : program)),
      );
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Program bilgileri kaydedilemedi.'));
    }
  }

  async function updatePeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = periods.find((period) => period.id === selectedPeriod);
    if (!current) return;
    const data = new FormData(event.currentTarget);
    setError('');
    try {
      const updated = await scholarshipApi.updatePeriod(current, {
        name: String(data.get('name')),
        academicYear: String(data.get('academicYear')),
        startsAt: readTurkishDateTime(data, 'startsAt'),
        endsAt: readTurkishDateTime(data, 'endsAt'),
        maxRecipients: Number(data.get('maxRecipients')) || null,
        allowWithdrawal: true,
      });
      setPeriods((values) => values.map((period) => (period.id === updated.id ? updated : period)));
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Dönem bilgileri kaydedilemedi.'));
    }
  }

  async function saveProgramDetails() {
    const currentProgram = programs.find((program) => program.id === selected);
    const currentPeriod = periods.find((period) => period.id === selectedPeriod);
    if (!currentProgram || !currentPeriod || !programFormRef.current || !periodFormRef.current)
      return;

    const programData = new FormData(programFormRef.current);
    const periodData = new FormData(periodFormRef.current);
    const updatedProgram = await scholarshipApi.updateProgram(currentProgram, {
      name: String(programData.get('name')),
      slug: String(programData.get('slug')),
      description: String(programData.get('description')),
    });
    const updatedPeriod = await scholarshipApi.updatePeriod(currentPeriod, {
      name: String(periodData.get('name')),
      academicYear: String(periodData.get('academicYear')),
      startsAt: readTurkishDateTime(periodData, 'startsAt'),
      endsAt: readTurkishDateTime(periodData, 'endsAt'),
      maxRecipients: Number(periodData.get('maxRecipients')) || null,
      allowWithdrawal: true,
    });
    setPrograms((values) =>
      values.map((value) => (value.id === updatedProgram.id ? updatedProgram : value)),
    );
    setPeriods((values) =>
      values.map((value) => (value.id === updatedPeriod.id ? updatedPeriod : value)),
    );
  }

  async function publishProgram() {
    const freshPeriods = await scholarshipApi.periods(selected);
    let period = freshPeriods.find((value) => value.id === selectedPeriod);
    if (!period) return;
    const now = Date.now();
    const nextStatus = new Date(period.startsAt).getTime() > now ? 'SCHEDULED' : 'OPEN';
    if (period.status === 'OPEN' && nextStatus === 'SCHEDULED') {
      period = await scholarshipApi.transition(period, 'DRAFT');
    }
    if (period.status === nextStatus) {
      setProgramPeriods((values) => ({ ...values, [selected]: period }));
      return;
    }
    const updated = await scholarshipApi.transition(period, nextStatus);
    setPeriods((values) => values.map((value) => (value.id === updated.id ? updated : value)));
    setProgramPeriods((values) => ({ ...values, [selected]: updated }));
  }

  async function finishProgram() {
    const freshPeriods = await scholarshipApi.periods(selected);
    const period = freshPeriods.find((value) => value.id === selectedPeriod);
    if (!period || !['OPEN', 'SCHEDULED'].includes(period.status)) return;
    const updated = await scholarshipApi.transition(period, 'CLOSED');
    setPeriods((values) => values.map((value) => (value.id === updated.id ? updated : value)));
    setProgramPeriods((values) => ({ ...values, [selected]: updated }));
    setNotice('Program bitirildi. Yeni başvuru alınmayacak.');
  }

  async function copyProgramId(id: string, input: HTMLInputElement) {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      input.select();
      document.execCommand('copy');
    }
    setNotice('Program ID kopyalandı.');
  }

  if (!selected && !creating) {
    return (
      <section className="admin-workspace">
        <header>
          <p className="eyebrow">Admin portalı</p>
          <h1>Program yönetimi</h1>
        </header>
        {error && (
          <p role="alert" className="status status--error">
            {error}
          </p>
        )}
        <section className="management-card">
          <div className="program-list" aria-label="Başvuru programları">
            {programs.map((program) => (
              <button
                className="program-card"
                key={program.id}
                type="button"
                onClick={() => {
                  setSelected(program.id);
                  setSelectedPeriod('');
                }}
              >
                <span className="program-card-main">
                  <strong>{program.name}</strong>
                  <span>{program.description}</span>
                  <code className="program-id">Program ID: {program.id}</code>
                </span>
                <ProgramState period={programPeriods[program.id]} now={loadedAt} />
              </button>
            ))}
            {programs.length === 0 && <p>Henüz bir başvuru programı yok.</p>}
          </div>
          <button className="action-create" type="button" onClick={() => setCreating(true)}>
            Yeni başvuru programı aç
          </button>
        </section>
      </section>
    );
  }
  const currentProgram = programs.find((program) => program.id === selected);
  const currentPeriod = periods.find((period) => period.id === selectedPeriod);
  return (
    <section className="admin-workspace">
      <header>
        <p className="eyebrow">Admin portalı</p>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setSelected('');
            setSelectedPeriod('');
            setCreating(false);
          }}
        >
          ← Başvuru programları
        </button>
        <h1>{creating ? 'Yeni başvuru programı' : currentProgram?.name}</h1>
        <p>Tüm program bilgilerini bu sayfadan yönetin.</p>
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
      {creating ? (
        <NewProgramEditor
          name={programName}
          slug={programSlug}
          onNameChange={(value) => {
            setProgramName(value);
            if (!slugEdited) setProgramSlug(toSlug(value));
          }}
          onSlugChange={(value) => {
            setProgramSlug(value);
            setSlugEdited(true);
          }}
          onSubmit={createProgram}
        />
      ) : currentProgram ? (
        <form
          className="management-card"
          key={currentProgram.id}
          ref={programFormRef}
          onSubmit={updateProgram}
        >
          <h2>1. Program bilgileri</h2>
          <label>
            Program ID
            <span className="copy-field">
              <input id="program-id" readOnly value={currentProgram.id} aria-label="Program ID" />
              <button
                type="button"
                className="secondary"
                onClick={(event) => {
                  const input = event.currentTarget.parentElement?.querySelector('input');
                  if (input) void copyProgramId(currentProgram.id, input);
                }}
              >
                Kopyala
              </button>
            </span>
          </label>
          <label>
            Ad
            <input name="name" required defaultValue={currentProgram.name} />
          </label>
          <label>
            URL adı
            <input name="slug" required defaultValue={currentProgram.slug} />
          </label>
          <label>
            Açıklama
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={currentProgram.description}
            />
          </label>
        </form>
      ) : null}
      {selected && (
        <>
          {periods.length === 0 && (
            <form className="management-card period-form" onSubmit={createPeriod}>
              <h2>2. Tarihler ve dönem</h2>
              <label>
                Ad
                <input name="name" required />
              </label>
              <label>
                Akademik yıl
                <input
                  name="academicYear"
                  required
                  pattern="[0-9]{4}-[0-9]{4}"
                  placeholder="2026-2027"
                />
              </label>
              <TurkishDateTimeInput name="startsAt" label="Başlangıç" />
              <TurkishDateTimeInput name="endsAt" label="Bitiş" />
              <label>
                Kontenjan
                <input name="maxRecipients" type="number" min={1} />
              </label>
              <button>Yeni dönem ekle</button>
            </form>
          )}
          {selectedPeriod && (
            <>
              {periods
                .filter((period) => period.id === selectedPeriod)
                .map((period) => (
                  <form
                    className="management-card period-form"
                    key={period.id}
                    ref={periodFormRef}
                    onSubmit={updatePeriod}
                  >
                    <h2>2. Tarihler</h2>
                    <input name="name" type="hidden" value={period.name} readOnly />
                    <input name="academicYear" type="hidden" value={period.academicYear} readOnly />
                    <TurkishDateTimeInput
                      name="startsAt"
                      label="Başlangıç"
                      defaultValue={period.startsAt}
                    />
                    <TurkishDateTimeInput
                      name="endsAt"
                      label="Bitiş"
                      defaultValue={period.endsAt}
                    />
                    <label>
                      Kontenjan
                      <input
                        name="maxRecipients"
                        type="number"
                        min={1}
                        defaultValue={period.maxRecipients ?? ''}
                      />
                    </label>
                  </form>
                ))}
              <FormBuilderPage
                periodIdOverride={selectedPeriod}
                embedded
                onBeforeSave={saveProgramDetails}
                onAfterPublish={publishProgram}
                active={currentPeriod?.status === 'OPEN' || currentPeriod?.status === 'SCHEDULED'}
                onFinish={finishProgram}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}

function toSlug(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function academicYear(date: Date) {
  const year = date.getFullYear();
  return `${year}-${year + 1}`;
}

function ProgramState({ period, now }: { period: Period | null | undefined; now: number }) {
  if (period?.status === 'CLOSED' || period?.status === 'COMPLETED')
    return (
      <span className="program-state program-state--finished">
        <strong>Bitmiş program</strong>
        <small>Başvuru alımı kapalı</small>
      </span>
    );
  const active = period?.status === 'OPEN' || period?.status === 'SCHEDULED';
  if (!active)
    return (
      <span className="program-state program-state--draft">
        <strong>Taslak</strong>
        <small>Henüz yayında değil</small>
      </span>
    );
  const days = Math.max(0, Math.ceil((new Date(period.endsAt).getTime() - now) / 86_400_000));
  return (
    <span className="program-state program-state--active">
      <strong>Aktif</strong>
      <small>{days} gün kaldı</small>
    </span>
  );
}

type DraftQuestion = {
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string;
};

type DraftDocument = {
  name: string;
  description: string;
  required: boolean;
  maxSizeMb: number;
  allowedMimeTypes: string[];
};

function NewProgramEditor({
  name,
  slug,
  onNameChange,
  onSlugChange,
  onSubmit,
}: {
  name: string;
  slug: string;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    questions: DraftQuestion[],
    documents: DraftDocument[],
    publish: boolean,
  ) => Promise<void>;
}) {
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { label: '', type: 'TEXT', required: false, placeholder: '' },
  ]);
  const [documents, setDocuments] = useState<DraftDocument[]>([]);

  return (
    <form
      className="program-editor"
      onSubmit={(event) =>
        void onSubmit(
          event,
          questions,
          documents,
          (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-action') === 'publish',
        )
      }
    >
      <section className="management-card">
        <h2>1. Program bilgileri</h2>
        <label>
          Ad
          <input
            required
            maxLength={200}
            name="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <label>
          URL adı
          <input
            required
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => onSlugChange(event.target.value)}
          />
        </label>
        <label>
          Açıklama
          <textarea required rows={4} name="description" />
        </label>
      </section>
      <section className="management-card period-form">
        <h2>2. Tarihler</h2>
        <TurkishDateTimeInput name="startsAt" label="Başlangıç" />
        <TurkishDateTimeInput name="endsAt" label="Bitiş" />
        <label>
          Kontenjan
          <input name="maxRecipients" type="number" min={1} />
        </label>
      </section>
      <section className="management-card draft-items">
        <h2>3. Sorular</h2>
        {questions.map((question, index) => (
          <div className="draft-item" key={index}>
            <label>
              Soru
              <input
                value={question.label}
                required
                onChange={(event) =>
                  setQuestions((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index ? { ...value, label: event.target.value } : value,
                    ),
                  )
                }
              />
            </label>
            <label>
              Tür
              <select
                value={question.type}
                onChange={(event) =>
                  setQuestions((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index
                        ? { ...value, type: event.target.value as FieldType }
                        : value,
                    ),
                  )
                }
              >
                <option value="TEXT">Kısa metin</option>
                <option value="TEXTAREA">Uzun metin</option>
                <option value="INTEGER">Sayı</option>
                <option value="DATE">Tarih</option>
                <option value="EMAIL">E-posta</option>
                <option value="PHONE">Telefon</option>
                <option value="BOOLEAN">Evet / Hayır</option>
              </select>
            </label>
            <label>
              Cevap ipucu
              <input
                value={question.placeholder}
                onChange={(event) =>
                  setQuestions((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index ? { ...value, placeholder: event.target.value } : value,
                    ),
                  )
                }
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(event) =>
                  setQuestions((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index ? { ...value, required: event.target.checked } : value,
                    ),
                  )
                }
              />{' '}
              Zorunlu
            </label>
            <button
              type="button"
              className="danger"
              onClick={() =>
                setQuestions((values) => values.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className="action-create"
          onClick={() =>
            setQuestions((values) => [
              ...values,
              { label: '', type: 'TEXT', required: false, placeholder: '' },
            ])
          }
        >
          Soru ekle
        </button>
      </section>
      <section className="management-card draft-items">
        <h2>4. İstenen belgeler</h2>
        {documents.map((document, index) => (
          <div className="draft-item" key={index}>
            <label>
              Belge adı
              <input
                required
                value={document.name}
                onChange={(event) =>
                  setDocuments((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index ? { ...value, name: event.target.value } : value,
                    ),
                  )
                }
              />
            </label>
            <label>
              Açıklama
              <input
                value={document.description}
                onChange={(event) =>
                  setDocuments((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index ? { ...value, description: event.target.value } : value,
                    ),
                  )
                }
              />
            </label>
            <label>
              Maksimum boyut (MB)
              <input
                type="number"
                min={1}
                max={10}
                value={document.maxSizeMb}
                onChange={(event) =>
                  setDocuments((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index
                        ? { ...value, maxSizeMb: Number(event.target.value) }
                        : value,
                    ),
                  )
                }
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={document.required}
                onChange={(event) =>
                  setDocuments((values) =>
                    values.map((value, itemIndex) =>
                      itemIndex === index ? { ...value, required: event.target.checked } : value,
                    ),
                  )
                }
              />{' '}
              Zorunlu
            </label>
            <button
              type="button"
              className="danger"
              onClick={() =>
                setDocuments((values) => values.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className="action-create"
          onClick={() =>
            setDocuments((values) => [
              ...values,
              {
                name: '',
                description: '',
                required: false,
                maxSizeMb: 5,
                allowedMimeTypes: ['application/pdf'],
              },
            ])
          }
        >
          Belge ekle
        </button>
      </section>
      <div className="program-editor-actions">
        <button className="action-save">Kaydet</button>
        <button className="action-create" data-action="publish">
          Kaydet ve yayınla
        </button>
      </div>
    </form>
  );
}

function toFormField(question: DraftQuestion, index: number): FormField {
  return {
    key: `soru_${index + 1}`,
    label: question.label.trim(),
    type: question.type,
    required: question.required,
    placeholder: question.placeholder.trim() || null,
    requirementId: null,
    validationRules: {},
    options: [],
  };
}
