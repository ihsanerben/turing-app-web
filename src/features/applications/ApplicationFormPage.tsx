import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FormField } from '../forms/formApi';
import { documentApi, type DocumentRequirement, type StoredFile } from '../documents/documentApi';
import { applicationApi, type ApplicationAnswer, type ApplicationForm } from './applicationApi';

export function ApplicationFormPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<ApplicationForm | null>(null);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([applicationApi.form(id), documentApi.requirements(id), documentApi.files(id)])
      .then(([value, documentRequirements, storedFiles]) => {
        if (active) {
          setData(value);
          setRequirements(documentRequirements);
          setFiles(storedFiles);
          setValues(
            Object.fromEntries(value.answers.map((answer) => [answer.fieldId, answer.value])),
          );
          setLoading(false);
        }
      })
      .catch((value) => {
        if (active) {
          setError(message(value));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);
  function payload(): ApplicationAnswer[] {
    return Object.entries(values)
      .filter(
        ([, value]) =>
          value !== '' &&
          value !== null &&
          value !== undefined &&
          (!Array.isArray(value) || value.length > 0),
      )
      .map(([fieldId, value]) => ({ fieldId, value }));
  }
  async function save() {
    if (!data) return null;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await applicationApi.save(id, data.application.version, payload());
      setData(updated);
      setNotice('Taslak kaydedildi.');
      return updated;
    } catch (value) {
      setError(message(value));
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!data) return;
    const saved = data.application.status === 'DRAFT' ? await save() : data;
    if (!saved) return;
    setBusy(true);
    try {
      const application = await applicationApi.submit(saved.application);
      setData({ ...saved, application });
      setNotice(
        saved.application.status === 'MISSING_DOCUMENT'
          ? 'Belgeleriniz yeniden gönderildi.'
          : 'Başvurunuz gönderildi.',
      );
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy(false);
    }
  }
  async function withdraw() {
    if (!data) return;
    setBusy(true);
    try {
      const application = await applicationApi.withdraw(data.application);
      setData({ ...data, application });
      setNotice('Başvuru geri çekildi.');
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Başvuru formu yükleniyor…</p>;
  if (!data)
    return (
      <section className="card">
        <h1>Başvuru bulunamadı</h1>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  const editable = data.application.status === 'DRAFT';
  const documentsEditable = editable || data.application.status === 'MISSING_DOCUMENT';
  return (
    <section className="portal-workspace application-form">
      <header>
        <p className="eyebrow">{data.application.programName}</p>
        <h1>{data.form.name}</h1>
        <p>
          {data.application.periodName} · Form v{data.form.versionNumber} ·{' '}
          {data.application.status}
        </p>
        <progress
          aria-label="Başvuru tamamlanma oranı"
          max="100"
          value={data.application.completion}
        />
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
      {data.form.sections.map((section) => (
        <fieldset key={section.id} disabled={!editable || busy}>
          <legend>{section.title}</legend>
          {section.description && <p>{section.description}</p>}
          {section.fields.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={values[field.id ?? '']}
              onChange={(value) =>
                setValues((current) => ({ ...current, [field.id ?? '']: value }))
              }
            />
          ))}
        </fieldset>
      ))}
      <DocumentPanel
        applicationId={id}
        requirements={requirements}
        files={files}
        editable={documentsEditable && !busy}
        onFiles={setFiles}
        onError={setError}
        onNotice={setNotice}
      />
      <div className="application-actions">
        <Link className="button-link secondary" to="/portal/applications">
          Listeye dön
        </Link>
        {editable && (
          <>
            <button disabled={busy} onClick={() => void save()}>
              Taslağı kaydet
            </button>
            <button disabled={busy} onClick={() => void submit()}>
              Kaydet ve gönder
            </button>
          </>
        )}
        {data.application.status === 'MISSING_DOCUMENT' && (
          <button disabled={busy} onClick={() => void submit()}>
            Belgeleri yeniden gönder
          </button>
        )}
        {(data.application.status === 'DRAFT' || data.application.status === 'SUBMITTED') && (
          <button className="danger" disabled={busy} onClick={() => void withdraw()}>
            Başvuruyu geri çek
          </button>
        )}
      </div>
    </section>
  );
}

function DocumentPanel({
  applicationId,
  requirements,
  files,
  editable,
  onFiles,
  onError,
  onNotice,
}: {
  applicationId: string;
  requirements: DocumentRequirement[];
  files: StoredFile[];
  editable: boolean;
  onFiles: (files: StoredFile[]) => void;
  onError: (value: string) => void;
  onNotice: (value: string) => void;
}) {
  async function refresh() {
    onFiles(await documentApi.files(applicationId));
  }
  async function upload(requirementId: string, file: File) {
    onError('');
    try {
      await documentApi.upload(applicationId, requirementId, file);
      await refresh();
      onNotice('Belge yüklendi.');
    } catch (error) {
      onError(message(error));
    }
  }
  async function remove(id: string) {
    onError('');
    try {
      await documentApi.remove(id);
      await refresh();
      onNotice('Belge silindi.');
    } catch (error) {
      onError(message(error));
    }
  }
  async function download(file: StoredFile) {
    try {
      const blob = await documentApi.download(file.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError(message(error));
    }
  }
  return (
    <section className="document-panel">
      <h2>Başvuru belgeleri</h2>
      {requirements.length === 0 ? (
        <p>Bu dönem için belge gereksinimi bulunmuyor.</p>
      ) : (
        requirements.map((requirement) => {
          const file = files.find(
            (value) => value.requirementId === requirement.id && value.status === 'ACTIVE',
          );
          const accept = requirement.allowedMimeTypes.join(',');
          return (
            <article key={requirement.id}>
              <div>
                <strong>
                  {requirement.name}
                  {requirement.required ? ' *' : ''}
                </strong>
                {requirement.description && <p>{requirement.description}</p>}
                <small>
                  {accept} · En fazla {Math.ceil(requirement.maxSizeBytes / 1024 / 1024)} MB
                </small>
              </div>
              {file ? (
                <div className="document-actions">
                  <span>{file.originalName}</span>
                  <button type="button" className="secondary" onClick={() => void download(file)}>
                    İndir
                  </button>
                  {editable && (
                    <button type="button" className="danger" onClick={() => void remove(file.id)}>
                      Sil
                    </button>
                  )}
                </div>
              ) : (
                <span>Henüz yüklenmedi</span>
              )}
              {editable && (
                <label className="document-upload">
                  {file ? 'Değiştir' : 'Dosya seç'}
                  <input
                    aria-label={`${requirement.name} yükle`}
                    type="file"
                    accept={accept}
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (selected) void upload(requirement.id, selected);
                      event.target.value = '';
                    }}
                  />
                </label>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.id}`;
  if (field.type === 'TEXTAREA')
    return (
      <label htmlFor={id}>
        {field.label}
        {field.required ? ' *' : ''}
        <textarea
          id={id}
          value={String(value ?? '')}
          placeholder={field.placeholder ?? ''}
          minLength={number(field.validationRules.minLength)}
          maxLength={number(field.validationRules.maxLength)}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  if (field.type === 'SELECT' || field.type === 'RADIO')
    return (
      <label htmlFor={id}>
        {field.label}
        {field.required ? ' *' : ''}
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Seçin</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (field.type === 'MULTI_SELECT')
    return (
      <fieldset className="multi-select">
        <legend>
          {field.label}
          {field.required ? ' *' : ''}
        </legend>
        {field.options.map((option) => (
          <label key={option.id}>
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(option.value)}
              onChange={(event) => {
                const current = Array.isArray(value)
                  ? (value.filter((item) => typeof item === 'string') as string[])
                  : [];
                onChange(
                  event.target.checked
                    ? [...current, option.value]
                    : current.filter((item) => item !== option.value),
                );
              }}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    );
  if (field.type === 'BOOLEAN' || field.type === 'CHECKBOX')
    return (
      <label className="check-label" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        {field.label}
        {field.required ? ' *' : ''}
      </label>
    );
  if (field.type === 'FILE')
    return (
      <p className="file-placeholder">
        <strong>{field.label}</strong> — Bu belgeyi aşağıdaki belge alanından yönetin.
      </p>
    );
  const inputType =
    field.type === 'DATE'
      ? 'date'
      : field.type === 'INTEGER' || field.type === 'DECIMAL'
        ? 'number'
        : field.type === 'EMAIL'
          ? 'email'
          : field.type === 'PHONE'
            ? 'tel'
            : 'text';
  return (
    <label htmlFor={id}>
      {field.label}
      {field.required ? ' *' : ''}
      <input
        id={id}
        type={inputType}
        step={field.type === 'INTEGER' ? '1' : field.type === 'DECIMAL' ? 'any' : undefined}
        min={number(field.validationRules.min)}
        max={number(field.validationRules.max)}
        minLength={number(field.validationRules.minLength)}
        maxLength={number(field.validationRules.maxLength)}
        value={String(value ?? '')}
        placeholder={field.placeholder ?? ''}
        onChange={(event) =>
          onChange(
            inputType === 'number' && event.target.value !== ''
              ? Number(event.target.value)
              : event.target.value,
          )
        }
      />
    </label>
  );
}
function number(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}
function message(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data?.message ?? 'İşlem tamamlanamadı.')
    : 'İşlem tamamlanamadı.';
}
