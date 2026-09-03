import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import {
  formApi,
  type FieldType,
  type FormDefinition,
  type FormField,
  type FormSection,
  type FormSummary,
} from './formApi';
import { documentApi, type DocumentRequirement } from '../documents/documentApi';

const fieldTypes: FieldType[] = [
  'TEXT',
  'TEXTAREA',
  'INTEGER',
  'DECIMAL',
  'DATE',
  'BOOLEAN',
  'SELECT',
  'MULTI_SELECT',
  'RADIO',
  'CHECKBOX',
  'EMAIL',
  'PHONE',
  'FILE',
];
const optionTypes = new Set<FieldType>(['SELECT', 'MULTI_SELECT', 'RADIO']);
const fieldTypeLabels: Record<FieldType, string> = {
  TEXT: 'Kısa metin',
  TEXTAREA: 'Uzun metin',
  INTEGER: 'Tam sayı',
  DECIMAL: 'Ondalıklı sayı',
  DATE: 'Tarih',
  BOOLEAN: 'Evet / Hayır',
  SELECT: 'Açılır seçim',
  MULTI_SELECT: 'Çoklu seçim',
  RADIO: 'Tek seçim',
  CHECKBOX: 'Onay kutusu',
  EMAIL: 'E-posta',
  PHONE: 'Telefon',
  FILE: 'Belge yükleme',
};
const formStatusLabels = { DRAFT: 'Taslak', PUBLISHED: 'Yayında', RETIRED: 'Kullanım dışı' };
const emptyField = (): FormField => ({
  key: '',
  label: '',
  type: 'TEXT',
  required: false,
  placeholder: null,
  requirementId: null,
  validationRules: {},
  options: [],
});
const emptySection = (): FormSection => ({
  title: 'Yeni bölüm',
  description: null,
  fields: [],
});

export function FormBuilderPage({
  periodIdOverride,
  embedded = false,
  onBeforeSave,
  onAfterPublish,
  active = false,
  onFinish,
}: {
  periodIdOverride?: string;
  embedded?: boolean;
  onBeforeSave?: () => Promise<void>;
  onAfterPublish?: () => Promise<void>;
  active?: boolean;
  onFinish?: () => Promise<void>;
} = {}) {
  const params = useParams();
  const periodId = periodIdOverride ?? params.periodId ?? '';
  const [versions, setVersions] = useState<FormSummary[]>([]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingRequirement, setEditingRequirement] = useState<DocumentRequirement | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([formApi.list(periodId), documentApi.adminRequirements(periodId)])
      .then(async ([values, documentRequirements]) => {
        const draft = values.find((value) => value.status === 'DRAFT');
        const base = draft ?? values[0];
        let selected = base
          ? await formApi.get(base.id)
          : embedded
            ? await formApi.create(periodId, 'Başvuru Formu')
            : null;
        if (embedded && selected && selected.status !== 'DRAFT') {
          selected = await formApi.newVersion(selected);
        }
        return {
          values: values.length === 0 && selected ? [selected] : values,
          documentRequirements,
          selected,
        };
      })
      .then(({ values, documentRequirements, selected }) => {
        if (active) {
          setVersions(values);
          setRequirements(documentRequirements);
          setForm(selected);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (active) {
          setError(apiErrorMessage(error, 'Form bilgileri yüklenemedi.'));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [embedded, periodId]);
  async function choose(id: string) {
    setError('');
    try {
      setForm(await formApi.get(id));
    } catch (e) {
      setError(apiErrorMessage(e, 'Form sürümü yüklenemedi.'));
    }
  }
  async function createRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requirementForm = event.currentTarget;
    const data = new FormData(requirementForm);
    setError('');
    setNotice('');
    try {
      const body = {
        name: String(data.get('name')),
        description: String(data.get('description')) || null,
        required: data.get('required') === 'on',
        allowedMimeTypes: data.getAll('mime').map(String),
        maxSizeBytes: Number(data.get('maxSizeMb')) * 1024 * 1024,
        order: editingRequirement?.order ?? requirements.length,
      };
      const created = editingRequirement
        ? await documentApi.updateRequirement(periodId, editingRequirement.id, body)
        : await documentApi.createRequirement(periodId, body);
      requirementForm.reset();
      setRequirements((values) =>
        editingRequirement
          ? values.map((value) => (value.id === created.id ? created : value))
          : [...values, created].sort((left, right) => left.order - right.order),
      );
      setEditingRequirement(null);
      setNotice(editingRequirement ? 'Belge güncellendi.' : 'Belge gereksinimi oluşturuldu.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Belge gereksinimi oluşturulamadı.'));
    }
  }
  async function deleteRequirement(requirement: DocumentRequirement) {
    setError('');
    try {
      await documentApi.deleteRequirement(periodId, requirement.id);
      setRequirements((values) => values.filter((value) => value.id !== requirement.id));
      setNotice('Belge kaldırıldı.');
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Belge kaldırılamadı.'));
    }
  }
  function updateSection(index: number, change: Partial<FormSection>) {
    if (!form) return;
    setForm({
      ...form,
      sections: form.sections.map((section, i) =>
        i === index ? { ...section, ...change } : section,
      ),
    });
  }
  function updateField(sectionIndex: number, fieldIndex: number, change: Partial<FormField>) {
    if (!form) return;
    const sections = form.sections.map((section, i) =>
      i === sectionIndex
        ? {
            ...section,
            fields: section.fields.map((field, j) =>
              j === fieldIndex ? { ...field, ...change } : field,
            ),
          }
        : section,
    );
    setForm({ ...form, sections });
  }
  function removeSection(index: number) {
    if (form) setForm({ ...form, sections: form.sections.filter((_, i) => i !== index) });
  }
  function removeField(sectionIndex: number, fieldIndex: number) {
    if (!form) return;
    setForm({
      ...form,
      sections: form.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, fields: section.fields.filter((_, j) => j !== fieldIndex) }
          : section,
      ),
    });
  }
  function moveField(sectionIndex: number, fieldIndex: number, direction: number) {
    if (!form) return;
    const fields = [...form.sections[sectionIndex].fields];
    const next = fieldIndex + direction;
    if (next < 0 || next >= fields.length) return;
    [fields[fieldIndex], fields[next]] = [fields[next], fields[fieldIndex]];
    updateSection(sectionIndex, { fields });
  }
  function updateRule(sectionIndex: number, fieldIndex: number, key: string, value: string) {
    if (!form) return;
    const field = form.sections[sectionIndex].fields[fieldIndex];
    const rules = { ...field.validationRules };
    if (value === '') delete rules[key];
    else rules[key] = key === 'pattern' ? value : Number(value);
    updateField(sectionIndex, fieldIndex, { validationRules: rules });
  }
  function moveSection(index: number, direction: number) {
    if (!form) return;
    const next = index + direction;
    if (next < 0 || next >= form.sections.length) return;
    const sections = [...form.sections];
    [sections[index], sections[next]] = [sections[next], sections[index]];
    setForm({ ...form, sections });
  }
  async function save() {
    if (!form) return;
    const prepared = prepareForm(form);
    if (typeof prepared === 'string') {
      setError(prepared);
      setNotice('');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await onBeforeSave?.();
      const updated = await formApi.save(prepared);
      setForm(updated);
      updateVersionSummary(updated);
      setNotice('Taslak kaydedildi.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Taslak kaydedilemedi.'));
    } finally {
      setSaving(false);
    }
  }
  async function publish() {
    if (!form) return;
    const prepared = prepareForm(form);
    if (typeof prepared === 'string') {
      setError(prepared);
      setNotice('');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await onBeforeSave?.();
      const saved = await formApi.save(prepared);
      const published = await formApi.publish(saved);
      await onAfterPublish?.();
      if (embedded) {
        const nextDraft = await formApi.newVersion(published);
        setForm(nextDraft);
        setVersions([
          nextDraft,
          published,
          ...versions.filter((value) => value.id !== published.id),
        ]);
      } else {
        setForm(published);
        updateVersionSummary(published);
      }
      setNotice('Program bilgileri kaydedildi ve başvuru formu yayınlandı.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Form yayınlanamadı.'));
    } finally {
      setSaving(false);
    }
  }
  async function newVersion() {
    if (!form) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await formApi.newVersion(form);
      setForm(updated);
      setVersions((values) => [updated, ...values]);
      setNotice('Yeni taslak versiyon oluşturuldu.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Yeni form sürümü oluşturulamadı.'));
    } finally {
      setSaving(false);
    }
  }
  function updateVersionSummary(updated: FormDefinition) {
    setVersions((values) => values.map((value) => (value.id === updated.id ? updated : value)));
  }
  if (loading) return <p role="status">Formlar yükleniyor…</p>;
  return (
    <section
      className={embedded ? 'form-builder form-builder--embedded' : 'admin-workspace form-builder'}
    >
      {!embedded && (
        <header>
          <p className="eyebrow">Başvuru formu</p>
          <h1>Başvuru formunu hazırla</h1>
          <p>Öğrenciden istenecek bilgileri ve belgeleri adım adım belirleyin.</p>
        </header>
      )}
      {!embedded && (
        <ol className="builder-steps" aria-label="Form hazırlama adımları">
          <li>
            <strong>1. Belgeler</strong>
            <span>Yüklenecek belgeleri tanımlayın.</span>
          </li>
          <li>
            <strong>2. Sorular</strong>
            <span>Bölüm ve form alanlarını ekleyin.</span>
          </li>
          <li>
            <strong>3. Yayınlama</strong>
            <span>Taslağı kaydedip formu yayınlayın.</span>
          </li>
        </ol>
      )}
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
      <div className="admin-grid document-requirements">
        <form
          className="management-card"
          key={editingRequirement?.id ?? 'new'}
          onSubmit={createRequirement}
        >
          <h2>4. İstenecek belgeyi ekle</h2>
          <label>
            Ad
            <input name="name" required maxLength={200} defaultValue={editingRequirement?.name} />
          </label>
          <label>
            Açıklama
            <input
              name="description"
              maxLength={1000}
              defaultValue={editingRequirement?.description ?? ''}
            />
          </label>
          <label>
            Maksimum boyut (MB)
            <input
              name="maxSizeMb"
              type="number"
              min="1"
              max="10"
              defaultValue={editingRequirement ? editingRequirement.maxSizeBytes / 1024 / 1024 : 5}
              required
            />
          </label>
          <fieldset>
            <legend>İzin verilen türler</legend>
            <label>
              <input
                name="mime"
                type="checkbox"
                value="application/pdf"
                defaultChecked={
                  !editingRequirement ||
                  editingRequirement.allowedMimeTypes.includes('application/pdf')
                }
              />{' '}
              PDF
            </label>
            <label>
              <input
                name="mime"
                type="checkbox"
                value="image/jpeg"
                defaultChecked={editingRequirement?.allowedMimeTypes.includes('image/jpeg')}
              />{' '}
              JPEG
            </label>
            <label>
              <input
                name="mime"
                type="checkbox"
                value="image/png"
                defaultChecked={editingRequirement?.allowedMimeTypes.includes('image/png')}
              />{' '}
              PNG
            </label>
          </fieldset>
          <label className="check-label">
            <input name="required" type="checkbox" defaultChecked={editingRequirement?.required} />{' '}
            Zorunlu
          </label>
          <button className={editingRequirement ? 'action-update' : 'action-create'}>
            {editingRequirement ? 'Belgeyi güncelle' : 'Belge ekle'}
          </button>
        </form>
        <section className="management-card">
          <h2>İstenen belgeler</h2>
          {requirements.length === 0 ? (
            <p>Henüz belge gereksinimi yok.</p>
          ) : (
            <ul>
              {requirements.map((value) => (
                <li
                  key={value.id}
                  className={editingRequirement?.id === value.id ? 'is-selected' : ''}
                  onClick={() => setEditingRequirement(value)}
                >
                  <strong>{value.name}</strong> · {value.required ? 'Zorunlu' : 'Opsiyonel'} ·{' '}
                  {Math.round(value.maxSizeBytes / 1024 / 1024)} MB
                  <span className="inline-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingRequirement(value);
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        void deleteRequirement(value);
                      }}
                    >
                      Sil
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {!form ? (
        <p>Program soruları hazırlanıyor…</p>
      ) : (
        <>
          <div
            className={embedded ? 'builder-toolbar builder-toolbar--embedded' : 'builder-toolbar'}
          >
            {!embedded && (
              <label>
                Versiyon
                <select
                  aria-label="Form versiyonu"
                  value={form.id}
                  onChange={(e) => void choose(e.target.value)}
                >
                  {versions.map((value) => (
                    <option key={value.id} value={value.id}>
                      v{value.versionNumber} · {formStatusLabels[value.status]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!embedded && (
              <span className={`form-badge form-badge--${form.status.toLowerCase()}`}>
                {formStatusLabels[form.status]}
              </span>
            )}
            {active && form.status === 'DRAFT' ? (
              <>
                <button
                  type="button"
                  className="action-update"
                  disabled={saving}
                  onClick={() => void publish()}
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={saving}
                  onClick={() => void onFinish?.()}
                >
                  Programı bitir
                </button>
              </>
            ) : form.status === 'DRAFT' ? (
              <>
                <button
                  className="action-save"
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  className="action-create"
                  disabled={saving}
                  onClick={() => void publish()}
                >
                  Yayınla
                </button>
              </>
            ) : (
              <button
                disabled={saving || versions.some((value) => value.status === 'DRAFT')}
                onClick={() => void newVersion()}
              >
                Yeni versiyon oluştur
              </button>
            )}
          </div>
          {form.status === 'DRAFT' ? (
            <div className="builder-content">
              <h2>3. Sorulacak sorular</h2>
              <label className="form-name-field">
                Form adı
                <input
                  value={form.name}
                  maxLength={200}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              {form.sections.map((section, sectionIndex) => (
                <section className="builder-section" key={section.id ?? sectionIndex}>
                  <div className="builder-section__heading">
                    <label>
                      Bölüm başlığı
                      <input
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                      />
                    </label>
                    <label>
                      Açıklama
                      <input
                        value={section.description ?? ''}
                        onChange={(e) =>
                          updateSection(sectionIndex, { description: e.target.value || null })
                        }
                      />
                    </label>
                    <div>
                      <button
                        aria-label="Bölümü yukarı taşı"
                        className="icon-button"
                        onClick={() => moveSection(sectionIndex, -1)}
                      >
                        ↑
                      </button>
                      <button
                        aria-label="Bölümü aşağı taşı"
                        className="icon-button"
                        onClick={() => moveSection(sectionIndex, 1)}
                      >
                        ↓
                      </button>
                      <button className="danger" onClick={() => removeSection(sectionIndex)}>
                        Bölümü sil
                      </button>
                    </div>
                  </div>
                  {section.fields.length === 0 && (
                    <p className="builder-empty-state">
                      Bu bölümde henüz soru yok. Aşağıdaki “Soru ekle” düğmesini kullanın.
                    </p>
                  )}
                  {section.fields.map((field, fieldIndex) => (
                    <article className="field-editor" key={field.id ?? fieldIndex}>
                      <label>
                        Soru
                        <input
                          value={field.label}
                          placeholder="Örneğin: Öğrenim gördüğünüz okul"
                          onChange={(e) =>
                            updateField(sectionIndex, fieldIndex, { label: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Tür
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const type = e.target.value as FieldType;
                            updateField(sectionIndex, fieldIndex, {
                              type,
                              options: optionTypes.has(type) ? field.options : [],
                              requirementId: type === 'FILE' ? field.requirementId : null,
                            });
                          }}
                        >
                          {fieldTypes.map((type) => (
                            <option key={type} value={type}>
                              {fieldTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!['BOOLEAN', 'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'FILE'].includes(
                        field.type,
                      ) && (
                        <label>
                          Cevap ipucu (isteğe bağlı)
                          <input
                            value={field.placeholder ?? ''}
                            placeholder="Örneğin: İstanbul Teknik Üniversitesi"
                            onChange={(e) =>
                              updateField(sectionIndex, fieldIndex, {
                                placeholder: e.target.value || null,
                              })
                            }
                          />
                        </label>
                      )}
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(sectionIndex, fieldIndex, { required: e.target.checked })
                          }
                        />{' '}
                        Zorunlu
                      </label>
                      <div className="field-actions">
                        <button
                          aria-label="Alanı yukarı taşı"
                          onClick={() => moveField(sectionIndex, fieldIndex, -1)}
                        >
                          ↑
                        </button>
                        <button
                          aria-label="Alanı aşağı taşı"
                          onClick={() => moveField(sectionIndex, fieldIndex, 1)}
                        >
                          ↓
                        </button>
                        <button
                          className="danger"
                          onClick={() => removeField(sectionIndex, fieldIndex)}
                        >
                          Sil
                        </button>
                      </div>
                      {field.type === 'FILE' && (
                        <label className="file-requirement-select">
                          Belge gereksinimi
                          <select
                            value={field.requirementId ?? ''}
                            required
                            onChange={(e) =>
                              updateField(sectionIndex, fieldIndex, {
                                requirementId: e.target.value || null,
                              })
                            }
                          >
                            <option value="">Seçin</option>
                            {requirements.map((value) => (
                              <option key={value.id} value={value.id}>
                                {value.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {['INTEGER', 'DECIMAL'].includes(field.type) && (
                        <div className="validation-editor">
                          <label>
                            Minimum
                            <input
                              type="number"
                              value={field.validationRules.min ?? ''}
                              onChange={(e) =>
                                updateRule(sectionIndex, fieldIndex, 'min', e.target.value)
                              }
                            />
                          </label>
                          <label>
                            Maksimum
                            <input
                              type="number"
                              value={field.validationRules.max ?? ''}
                              onChange={(e) =>
                                updateRule(sectionIndex, fieldIndex, 'max', e.target.value)
                              }
                            />
                          </label>
                        </div>
                      )}
                      {optionTypes.has(field.type) && (
                        <OptionEditor
                          field={field}
                          onChange={(options) => updateField(sectionIndex, fieldIndex, { options })}
                        />
                      )}
                    </article>
                  ))}
                  <button
                    className="action-create"
                    onClick={() =>
                      updateSection(sectionIndex, { fields: [...section.fields, emptyField()] })
                    }
                  >
                    Soru ekle
                  </button>
                </section>
              ))}
              <button
                className="action-create"
                onClick={() => setForm({ ...form, sections: [...form.sections, emptySection()] })}
              >
                Bölüm ekle
              </button>
            </div>
          ) : (
            <FormPreview form={form} />
          )}
        </>
      )}
    </section>
  );
}

function OptionEditor({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (options: FormField['options']) => void;
}) {
  function move(index: number, direction: number) {
    const options = [...field.options];
    const next = index + direction;
    if (next < 0 || next >= options.length) return;
    [options[index], options[next]] = [options[next], options[index]];
    onChange(options);
  }
  return (
    <fieldset className="option-editor">
      <legend>Seçenekler</legend>
      {field.options.map((option, index) => (
        <div key={option.id ?? index}>
          <input
            aria-label={`Seçenek ${index + 1}`}
            placeholder="Seçenek"
            value={option.label}
            onChange={(e) =>
              onChange(
                field.options.map((value, i) =>
                  i === index
                    ? { ...value, label: e.target.value, value: slugify(e.target.value) }
                    : value,
                ),
              )
            }
          />
          <button aria-label={`Seçenek ${index + 1} yukarı`} onClick={() => move(index, -1)}>
            ↑
          </button>
          <button aria-label={`Seçenek ${index + 1} aşağı`} onClick={() => move(index, 1)}>
            ↓
          </button>
          <button
            className="danger"
            onClick={() => onChange(field.options.filter((_, i) => i !== index))}
          >
            Sil
          </button>
        </div>
      ))}
      <button
        className="secondary"
        onClick={() => onChange([...field.options, { label: '', value: '' }])}
      >
        Seçenek ekle
      </button>
    </fieldset>
  );
}
function FormPreview({ form }: { form: FormDefinition }) {
  return (
    <div className="form-preview">
      <h2>{form.name}</h2>
      {form.sections.map((section) => (
        <section key={section.id}>
          <h3>{section.title}</h3>
          {section.description && <p>{section.description}</p>}
          {section.fields.map((field) => (
            <div className="preview-field" key={field.id}>
              <strong>
                {field.label}
                {field.required ? ' *' : ''}
              </strong>
              <span>
                {fieldTypeLabels[field.type]}
                {field.options.length
                  ? ` · ${field.options.map((option) => option.label).join(', ')}`
                  : ''}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function prepareForm(form: FormDefinition): FormDefinition | string {
  if (!form.name.trim()) return 'Form adını yazın.';
  if (form.sections.length === 0) return 'Forma en az bir bölüm ekleyin.';

  const usedKeys = new Set<string>();
  for (const [sectionIndex, section] of form.sections.entries()) {
    if (!section.title.trim()) return `${sectionIndex + 1}. bölümün başlığını yazın.`;
    if (section.fields.length === 0) return `“${section.title}” bölümüne en az bir soru ekleyin.`;

    for (const [fieldIndex, field] of section.fields.entries()) {
      if (!field.label.trim())
        return `“${section.title}” bölümündeki ${fieldIndex + 1}. soruyu yazın.`;
      if (optionTypes.has(field.type) && field.options.length === 0)
        return `“${field.label}” sorusuna en az bir seçenek ekleyin.`;
      if (optionTypes.has(field.type) && field.options.some((option) => !option.label.trim()))
        return `“${field.label}” sorusundaki boş seçenekleri doldurun veya silin.`;
      if (field.type === 'FILE' && !field.requirementId)
        return `“${field.label}” sorusu için istenecek belgeyi seçin.`;
    }
  }

  return {
    ...form,
    name: form.name.trim(),
    sections: form.sections.map((section) => ({
      ...section,
      title: section.title.trim(),
      fields: section.fields.map((field) => ({
        ...field,
        key: uniqueKey(slugify(field.label), usedKeys),
        label: field.label.trim(),
        options: field.options.map((option) => ({
          ...option,
          label: option.label.trim(),
          value: slugify(option.label),
        })),
      })),
    })),
  };
}

function uniqueKey(candidate: string, usedKeys: Set<string>) {
  const base = candidate || 'soru';
  let key = base;
  let suffix = 2;
  while (usedKeys.has(key)) key = `${base}_${suffix++}`;
  usedKeys.add(key);
  return key;
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
