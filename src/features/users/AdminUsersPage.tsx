import { useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { Modal } from '../../components/Modal';
import { formatTurkishDateTime } from '../../components/turkishDateTime';
import { adminUserApi, type AdminUser } from './adminUserApi';

export function AdminUsersPage({ role }: { role: 'students' | 'admins' }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const students = role === 'students';

  useEffect(() => {
    adminUserApi[role]()
      .then((values) => {
        setUsers(values);
        setSelected(null);
      })
      .catch((e) => setError(apiErrorMessage(e, 'Kullanıcılar yüklenemedi.')));
  }, [role]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    return users
      .filter((user) => !department || (user.departmentName ?? user.otherDepartment) === department)
      .filter((user) => !accountStatus || user.accountStatus === accountStatus)
      .filter(
        (user) =>
          !query ||
          `${user.firstName} ${user.lastName} ${user.email} ${user.id}`
            .toLocaleLowerCase('tr-TR')
            .includes(query),
      )
      .sort((left, right) => {
        if (sort === 'date-desc')
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        const comparison = `${left.firstName} ${left.lastName}`.localeCompare(
          `${right.firstName} ${right.lastName}`,
          'tr',
        );
        return sort === 'name-desc' ? -comparison : comparison;
      });
  }, [accountStatus, department, search, sort, users]);
  const departments = useMemo(
    () =>
      [
        ...new Set(
          users.map((user) => user.departmentName ?? user.otherDepartment).filter(Boolean),
        ),
      ].sort((a, b) => String(a).localeCompare(String(b), 'tr')) as string[],
    [users],
  );
  const accountStatuses = useMemo(
    () => [...new Set(users.map((user) => user.accountStatus))].sort(),
    [users],
  );
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement('textarea');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setNotice(`${label} kopyalandı.`);
  }

  return (
    <section className="admin-workspace people-page">
      <header>
        <p className="eyebrow">Kullanıcılar</p>
        <h1>{students ? 'Öğrenciler' : 'Adminler'}</h1>
        <p>
          {students
            ? 'Sisteme kayıtlı öğrencileri ve profil bilgilerini görüntüleyin.'
            : 'Sistemdeki admin hesaplarını görüntüleyin.'}
        </p>
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
      <section className="management-card">
        <div className="people-filters">
          <label>
            Ara
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, e-posta veya kullanıcı ID"
            />
          </label>
          {students && (
            <label>
              Bölüm
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Tüm bölümler</option>
                {departments.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Hesap durumu
            <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)}>
              <option value="">Tüm durumlar</option>
              {accountStatuses.map((value) => (
                <option key={value} value={value}>
                  {accountStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sırala
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name-asc">Ada göre A–Z</option>
              <option value="name-desc">Ada göre Z–A</option>
              <option value="date-desc">En yeni kayıt</option>
            </select>
          </label>
        </div>
        <div className="people-list">
          {filtered.map((user) => (
            <article
              className={students ? 'person-row person-row--student' : 'person-row'}
              key={user.id}
            >
              <button
                type="button"
                className="copy-value"
                onClick={() => void copy(user.firstName, 'Ad')}
              >
                <small>Ad</small>
                <strong>{user.firstName}</strong>
              </button>
              <button
                type="button"
                className="copy-value"
                onClick={() => void copy(user.lastName, 'Soyad')}
              >
                <small>Soyad</small>
                <strong>{user.lastName}</strong>
              </button>
              <button
                type="button"
                className="copy-value"
                onClick={() => void copy(user.email, 'E-posta')}
              >
                <small>E-posta</small>
                <strong>{user.email}</strong>
              </button>
              {students && (
                <>
                  <button
                    type="button"
                    className="copy-value"
                    onClick={() =>
                      void copy(user.universityName ?? user.otherUniversity ?? '—', 'Üniversite')
                    }
                  >
                    <small>Üniversite</small>
                    <strong>{user.universityName ?? user.otherUniversity ?? '—'}</strong>
                  </button>
                  <button
                    type="button"
                    className="copy-value"
                    onClick={() =>
                      void copy(user.departmentName ?? user.otherDepartment ?? '—', 'Bölüm')
                    }
                  >
                    <small>Bölüm</small>
                    <strong>{user.departmentName ?? user.otherDepartment ?? '—'}</strong>
                  </button>
                </>
              )}
              <button
                type="button"
                className="danger detail-button"
                onClick={() => setSelected(user)}
              >
                Detay
              </button>
            </article>
          ))}
          {!filtered.length && <p>Kayıt bulunamadı.</p>}
        </div>
      </section>
      {selected && (
        <Modal
          title={`${selected.firstName} ${selected.lastName}`}
          onClose={() => setSelected(null)}
        >
          <UserDetail user={selected} student={students} />
        </Modal>
      )}
    </section>
  );
}

function UserDetail({ user, student }: { user: AdminUser; student: boolean }) {
  const rows: [string, unknown][] = [
    ['Kullanıcı ID', user.id],
    ['Ad', user.firstName],
    ['Soyad', user.lastName],
    ['E-posta', user.email],
    ['Rol', user.role],
    ['Hesap durumu', user.accountStatus],
    ['Kayıt tarihi', format(user.createdAt)],
    ['Son giriş', format(user.lastLoginAt)],
  ];
  if (student)
    rows.push(
      ['TC kimlik no', user.nationalId],
      ['Doğum tarihi', user.birthDate],
      ['Telefon', user.phone],
      ['Adres', user.addressLine],
      ['Şehir', user.city],
      ['Üniversite', user.universityName ?? user.otherUniversity],
      ['Bölüm', user.departmentName ?? user.otherDepartment],
      ['Eğitim seviyesi', user.educationLevel],
      ['Sınıf', user.studyYear],
      ['Not ortalaması', user.gpa],
    );
  return (
    <section className="management-card person-detail">
      <h2>
        {user.firstName} {user.lastName}
      </h2>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{String(value ?? '—')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function format(value: string | null) {
  return value ? formatTurkishDateTime(value) : '—';
}

function accountStatusLabel(value: string) {
  if (value === 'ACTIVE') return 'Aktif';
  if (value === 'PENDING_VERIFICATION') return 'Doğrulama bekliyor';
  if (value === 'LOCKED') return 'Kilitli';
  if (value === 'DISABLED') return 'Devre dışı';
  return value;
}
