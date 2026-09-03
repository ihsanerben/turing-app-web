import axios from 'axios';
import { useEffect, useState } from 'react';
import { adminStatisticsApi, type AdminStatistics } from './adminStatisticsApi';

export function AdminDashboardPage() {
  return (
    <section className="admin-workspace admin-dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Admin portalı</p>
          <h1>Yönetim merkezi</h1>
          <p>Yönetmek istediğiniz alanı sol menüden seçebilirsiniz.</p>
        </div>
      </header>
    </section>
  );
}

export function AdminStatisticsPage() {
  const [data, setData] = useState<AdminStatistics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminStatisticsApi
      .get()
      .then(setData)
      .catch((value) => setError(message(value)));
  }, []);

  if (error) return <p className="status status--error">{error}</p>;
  if (!data) return <p role="status">İstatistikler yükleniyor…</p>;
  const applicationRate = data.registeredCandidates
    ? Math.round((data.candidatesWithApplication / data.registeredCandidates) * 100)
    : 0;
  return (
    <section className="admin-workspace">
      <header>
        <p className="eyebrow">Yönetim</p>
        <h1>İstatistikler</h1>
      </header>
      <section className="portal-metrics" aria-label="Sistem istatistikleri">
        <Stat label="Kayıtlı bursiyer adayı" value={data.registeredCandidates} />
        <Stat label="Başvuru yapan aday" value={data.candidatesWithApplication} />
        <Stat label="Başvuruya dönüşüm" value={`%${applicationRate}`} />
        <Stat label="Toplam başvuru" value={data.totalApplications} />
        <Stat label="Taslak başvuru" value={data.draftApplications} />
        <Stat label="Gönderilmiş başvuru" value={data.submittedApplications} />
        <Stat label="İncelenen başvuru" value={data.applicationsUnderReview} />
        <Stat label="Onaylanan başvuru" value={data.approvedApplications} />
        <Stat label="Reddedilen başvuru" value={data.rejectedApplications} />
        <Stat label="Yedek başvuru" value={data.waitlistedApplications} />
        <Stat label="Ortalama tamamlanma" value={`%${Math.round(data.averageCompletion)}`} />
        <Stat label="Aktif program" value={data.activePrograms} />
        <Stat label="Planlanmış program" value={data.scheduledPeriods} />
        <Stat label="Başvuruya açık program" value={data.openPeriods} />
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function message(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Yönetim bilgileri yüklenemedi. Lütfen yeniden deneyin.';
}
