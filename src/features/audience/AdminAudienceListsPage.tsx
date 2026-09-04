import { useEffect, useState } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { Modal } from '../../components/Modal';
import {
  adminApplicationApi,
  type AdminApplication,
} from '../adminApplications/adminApplicationApi';
import type { ApplicationStatus } from '../applications/applicationApi';
import { applicationStatusGroup, applicationStatusLabel } from '../portal/portalPresentation';
import { scholarshipApi, type Program } from '../scholarship/scholarshipApi';
import { audienceListApi, type AudienceList } from './audienceListApi';
import { StudentDetailsButton } from '../users/StudentDetailsButton';

const statuses: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'Tüm başvurular' },
  { value: 'SUBMITTED', label: 'Beklemede' },
  { value: 'MISSING_DOCUMENT', label: 'Eksik belge' },
  { value: 'APPROVED', label: 'Olumlu' },
  { value: 'REJECTED', label: 'Olumsuz' },
];
export function AdminAudienceListsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [lists, setLists] = useState<AudienceList[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [programId, setProgramId] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AudienceList | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingMembers, setEditingMembers] = useState<Set<string>>(new Set());
  useEffect(() => {
    Promise.all([scholarshipApi.programs(), audienceListApi.all()])
      .then(([p, l]) => {
        setPrograms(p);
        setLists(l);
      })
      .catch((e) => setError(apiErrorMessage(e, 'Listeler yüklenemedi.')));
  }, []);
  async function chooseProgram(id: string) {
    setProgramId(id);
    setSelected(new Set());
    setApplications([]);
    try {
      const first = await adminApplicationApi.list(
        new URLSearchParams({ programId: id, size: '100' }),
      );
      const pages = await Promise.all(
        Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
          adminApplicationApi.list(
            new URLSearchParams({ programId: id, size: '100', page: String(index + 1) }),
          ),
        ),
      );
      setApplications([first, ...pages].flatMap((page) => page.content));
    } catch (e) {
      setError(apiErrorMessage(e, 'Programa ait başvurular yüklenemedi.'));
    }
  }
  async function openList(list: AudienceList) {
    setEditing(list);
    setEditingName(list.name);
    setEditingMembers(new Set(list.members.map((value) => value.applicationId)));
    if (programId !== list.programId) await chooseProgram(list.programId);
  }
  const visible = applications.filter(
    (value) => !status || applicationStatusGroup(value.status) === status,
  );
  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  async function create() {
    try {
      const created = await audienceListApi.create(name, programId, [...selected]);
      setLists((values) => [created, ...values]);
      setName('');
      setSelected(new Set());
      setNotice('Liste oluşturuldu.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Liste oluşturulamadı.'));
    }
  }
  async function update() {
    if (!editing) return;
    try {
      const updated = await audienceListApi.update(
        editing.id,
        editingName,
        [...editingMembers],
        editing.version,
      );
      setLists((values) => values.map((value) => (value.id === updated.id ? updated : value)));
      setEditing(null);
      setNotice('Liste güncellendi.');
    } catch (e) {
      setError(apiErrorMessage(e, 'Liste güncellenemedi.'));
    }
  }
  return (
    <section className="admin-workspace audience-page">
      <header>
        <p className="eyebrow">İletişim</p>
        <h1>Listeler</h1>
        <p>E-posta ve toplu mülakat için öğrenci grupları oluşturun.</p>
      </header>
      {error && (
        <p className="status status--error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="status status--success" role="status">
          {notice}
        </p>
      )}
      <section className="management-card audience-builder">
        <h2>Yeni liste</h2>
        <label>
          Program
          <select value={programId} onChange={(e) => void chooseProgram(e.target.value)}>
            <option value="">Program seçin</option>
            {programs.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Başvuru durumu
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus | '')}
          >
            {statuses.map((value) => (
              <option key={value.value} value={value.value}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        {programId && (
          <>
            <div className="audience-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setSelected(new Set(visible.map((value) => value.id)))}
              >
                Görünenlerin tamamını seç
              </button>
              <span>{selected.size} öğrenci seçildi</span>
            </div>
            <div className="audience-members">
              {visible.map((value) => (
                <label key={value.id}>
                  <input
                    type="checkbox"
                    checked={selected.has(value.id)}
                    onChange={() => toggle(value.id)}
                  />
                  <span>
                    <StudentDetailsButton name={value.studentName} userId={value.studentUserId} />
                    <small>{value.studentEmail}</small>
                  </span>
                  <span>{value.university ?? '—'}</span>
                  <span>{value.department ?? '—'}</span>
                  <span>{applicationStatusLabel(value.status)}</span>
                </label>
              ))}
            </div>
            <label>
              Liste adı
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <button
              type="button"
              className="action-create"
              disabled={!name.trim() || selected.size === 0}
              onClick={() => void create()}
            >
              Liste oluştur
            </button>
          </>
        )}
      </section>
      <section className="management-card">
        <h2>Oluşturulan listeler</h2>
        <div className="management-list">
          {lists.map((value) => (
            <button
              className="audience-list-row"
              key={value.id}
              onClick={() => void openList(value)}
            >
              <span>
                <strong>{value.name}</strong>
                <small>{value.programName}</small>
              </span>
              <strong>{value.members.length} öğrenci</strong>
            </button>
          ))}
        </div>
      </section>
      {editing && (
        <Modal title={editing.name} onClose={() => setEditing(null)}>
          <label>
            Liste adı
            <input value={editingName} onChange={(event) => setEditingName(event.target.value)} />
          </label>
          <div className="audience-members audience-members--editing">
            {applications.map((value) => (
              <label key={value.id}>
                <input
                  type="checkbox"
                  checked={editingMembers.has(value.id)}
                  onChange={() =>
                    setEditingMembers((current) => {
                      const next = new Set(current);
                      if (next.has(value.id)) next.delete(value.id);
                      else next.add(value.id);
                      return next;
                    })
                  }
                />
                <StudentDetailsButton name={value.studentName} userId={value.studentUserId} />
                <span>{value.studentEmail}</span>
                <span>{value.university ?? '—'}</span>
                <span>{value.department ?? '—'}</span>
                <span>{applicationStatusLabel(value.status)}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="action-save"
            disabled={!editingName.trim() || editingMembers.size === 0}
            onClick={() => void update()}
          >
            Listeyi kaydet
          </button>
        </Modal>
      )}
    </section>
  );
}
