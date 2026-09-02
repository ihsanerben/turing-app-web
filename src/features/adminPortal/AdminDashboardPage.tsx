import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApplicationApi, type AdminPage } from '../adminApplications/adminApplicationApi';
import { notificationApi, type CampaignSummary } from '../notifications/notificationApi';
import { scholarshipApi, type Program } from '../scholarship/scholarshipApi';

type DashboardData = { applications: AdminPage; campaigns: CampaignSummary[]; programs: Program[] };

const quickActions = [
  [
    '/admin/applications',
    'Başvuruları yönet',
    'Başvuru durumlarını, belgeleri ve notları inceleyin.',
  ],
  ['/admin/evaluation', 'Değerlendirme', 'Kriter puanlarını ve dönem sıralamasını yönetin.'],
  ['/admin/interviews', 'Mülakatlar', 'Mülakatları planlayın ve sonuçlarını kaydedin.'],
  ['/admin/audit', 'Audit kayıtları', 'Kritik yönetim işlemlerini takip edin.'],
] as const;

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApplicationApi.list(
        new URLSearchParams({ page: '0', size: '5', sort: 'createdAt,desc' }),
      ),
      notificationApi.campaigns(),
      scholarshipApi.programs(),
    ])
      .then(([applications, campaigns, programs]) => {
        if (active) setData({ applications, campaigns, programs });
      })
      .catch((value) => {
        if (active) setError(message(value));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <section className="admin-workspace">
        <h1>Yönetim özeti yüklenemedi</h1>
        <p role="alert" className="status status--error">
          {error}
        </p>
      </section>
    );
  if (!data) return <p role="status">Yönetim özeti yükleniyor…</p>;

  const failedEmails = data.campaigns.reduce((total, campaign) => total + campaign.failedCount, 0);

  return (
    <section className="admin-workspace admin-dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Admin portalı</p>
          <h1>Yönetim merkezi</h1>
          <p>Başvuru sürecinin kritik operasyonlarına tek ekrandan ulaşın.</p>
        </div>
        <Link className="button-link" to="/admin/applications">
          Başvuruları aç
        </Link>
      </header>
      <section className="portal-metrics" aria-label="Yönetim özeti">
        <article>
          <span>Toplam başvuru</span>
          <strong>{data.applications.totalElements}</strong>
        </article>
        <article>
          <span>Aktif burs programı</span>
          <strong>{data.programs.filter((program) => program.active).length}</strong>
        </article>
        <article>
          <span>Başarısız e-posta</span>
          <strong>{failedEmails}</strong>
        </article>
      </section>
      <div className="dashboard-grid admin-action-grid">
        {quickActions.map(([to, title, description]) => (
          <article className="management-card" key={to}>
            <h2>{title}</h2>
            <p>{description}</p>
            <Link to={to}>{title} ekranını aç</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function message(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Yönetim bilgileri yüklenemedi. Lütfen yeniden deneyin.';
}
