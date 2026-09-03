import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { applicationApi, type Application, type PublicScholarship } from './applicationApi';

export function ProgramsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [programs, setPrograms] = useState<PublicScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([applicationApi.list(), applicationApi.scholarships()])
      .then(([current, published]) => {
        setApplications(current);
        setPrograms(published);
      })
      .catch((reason) => setError(apiErrorMessage(reason, 'Programlar yüklenemedi.')))
      .finally(() => setLoading(false));
  }, []);

  async function apply(periodId: string) {
    setStarting(periodId);
    setError('');
    try {
      const created = await applicationApi.create(periodId);
      navigate(`/portal/applications/${created.id}/form`);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Başvuru başlatılamadı.'));
    } finally {
      setStarting('');
    }
  }

  const used = new Set(applications.map((value) => value.periodId));
  const published = programs.flatMap((value) =>
    value.periods.map((period) => ({ program: value.program, period })),
  );
  if (loading) return <p role="status">Programlar yükleniyor…</p>;
  return (
    <section className="portal-workspace">
      <header>
        <p className="eyebrow">Öğrenci portalı</p>
        <h1>Programlar</h1>
        <p>Yayındaki programları inceleyin ve istediğiniz programa başvurun.</p>
      </header>
      {error && <p className="status status--error">{error}</p>}
      <section className="management-card application-list">
        {published.length === 0 && <p>Şu anda yayınlanmış bir program yok.</p>}
        {published.map(({ program, period }) => (
          <article key={period.id}>
            <div>
              <strong>{program.name}</strong>
              <span>{program.description}</span>
            </div>
            <button
              className="action-create"
              disabled={used.has(period.id) || period.status !== 'OPEN' || starting === period.id}
              onClick={() => void apply(period.id)}
            >
              {used.has(period.id)
                ? 'Başvurularıma eklendi'
                : period.status === 'SCHEDULED'
                  ? 'Yakında açılacak'
                  : 'Başvur'}
            </button>
          </article>
        ))}
      </section>
    </section>
  );
}
