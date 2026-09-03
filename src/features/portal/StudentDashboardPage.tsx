import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTurkishDateTime } from '../../components/turkishDateTime';
import { applicationApi, type Application } from '../applications/applicationApi';
import { useAuth } from '../auth/authContextValue';
import { interviewApi, type StudentInterview } from '../interviews/interviewApi';
import { notificationApi, type Notification } from '../notifications/notificationApi';
import { profileApi, type Profile } from '../profile/profileApi';
import {
  applicationAction,
  applicationStatusLabel,
  applicationStatusTone,
  interviewStatusLabel,
} from './portalPresentation';

type DashboardData = {
  profile: Profile;
  applications: Application[];
  interviews: StudentInterview[];
  notifications: Notification[];
};

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadedAt] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    Promise.all([
      profileApi.get(),
      applicationApi.list(),
      interviewApi.mine(),
      notificationApi.mine(),
    ])
      .then(([profile, applications, interviews, notifications]) => {
        if (active) setData({ profile, applications, interviews, notifications });
      })
      .catch((value) => {
        if (active) setError(message(value));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const upcomingInterview = useMemo(
    () =>
      data?.interviews
        .filter(
          (interview) =>
            (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') &&
            new Date(interview.endsAt).getTime() > loadedAt,
        )
        .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))[0],
    [data, loadedAt],
  );

  if (loading) return <p role="status">Portal bilgileri yükleniyor…</p>;
  if (!data)
    return (
      <section className="portal-workspace">
        <h1>Portal yüklenemedi</h1>
        <p role="alert" className="status status--error">
          {error}
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Yeniden dene
        </button>
      </section>
    );

  const unreadCount = data.notifications.filter((notification) => !notification.readAt).length;
  const activeApplications = data.applications.filter(
    (application) => !['WITHDRAWN', 'REJECTED'].includes(application.status),
  );
  const actionableApplication =
    data.applications.find((application) => application.status === 'MISSING_DOCUMENT') ??
    data.applications.find((application) => application.status === 'DRAFT');
  const latestApplication = [...data.applications].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )[0];

  return (
    <section className="portal-workspace student-dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Öğrenci portalı</p>
          <h1>Merhaba, {user?.firstName}</h1>
          <p>Başvurularınızdaki gelişmeleri ve sıradaki işlemlerinizi tek yerden takip edin.</p>
        </div>
        <Link className="button-link" to="/portal/applications">
          Başvurularıma git
        </Link>
      </header>

      <section className="portal-metrics" aria-label="Portal özeti">
        <article>
          <span>Aktif başvuru</span>
          <strong>{activeApplications.length}</strong>
        </article>
        <article>
          <span>Okunmamış bildirim</span>
          <strong>{unreadCount}</strong>
        </article>
        <article>
          <span>Yaklaşan mülakat</span>
          <strong>{upcomingInterview ? '1' : '0'}</strong>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="management-card next-step-card">
          <p className="eyebrow">Sıradaki adım</p>
          {!data.profile.id ? (
            <>
              <h2>Profilinizi tamamlayın</h2>
              <p>Başvuru oluşturmadan önce kimlik, iletişim ve eğitim bilgilerinizi kaydedin.</p>
              <Link className="button-link" to="/portal/profile">
                Profile git
              </Link>
            </>
          ) : actionableApplication ? (
            <>
              <h2>{applicationAction(actionableApplication)}</h2>
              <p>
                {actionableApplication.programName} · {actionableApplication.periodName}
              </p>
              <Link
                className="button-link"
                to={`/portal/applications/${actionableApplication.id}/form`}
              >
                {applicationAction(actionableApplication)}
              </Link>
            </>
          ) : upcomingInterview ? (
            <>
              <h2>Yaklaşan mülakatınız var</h2>
              <p>
                {upcomingInterview.programName} · {formatDate(upcomingInterview.startsAt)}
              </p>
              <Link className="button-link" to="/portal/interviews">
                Mülakat bilgilerini aç
              </Link>
            </>
          ) : (
            <>
              <h2>Programları inceleyin</h2>
              <p>Yayınlanmış programları programlar sayfasından takip edebilirsiniz.</p>
              <Link className="button-link" to="/portal/programs">
                Programları gör
              </Link>
            </>
          )}
        </section>

        <section className="management-card">
          <div className="section-heading">
            <h2>Son başvuru durumu</h2>
            <Link to="/portal/applications">Tümünü gör</Link>
          </div>
          {latestApplication ? (
            <article className="application-summary">
              <div>
                <strong>{latestApplication.programName}</strong>
                <span>{latestApplication.periodName}</span>
              </div>
              <span
                className={`status-badge status-badge--${applicationStatusTone(latestApplication.status)}`}
              >
                {applicationStatusLabel(latestApplication.status)}
              </span>
              <progress
                aria-label={`${latestApplication.programName} tamamlanma oranı`}
                max="100"
                value={latestApplication.completion}
              />
            </article>
          ) : (
            <p>Henüz başvurunuz yok.</p>
          )}
        </section>

        <section className="management-card">
          <div className="section-heading">
            <h2>Mülakat</h2>
            <Link to="/portal/interviews">Takvimi aç</Link>
          </div>
          {upcomingInterview ? (
            <article className="dashboard-event">
              <strong>{upcomingInterview.programName}</strong>
              <span>{formatDate(upcomingInterview.startsAt)}</span>
              <span>{interviewStatusLabel(upcomingInterview.status)}</span>
            </article>
          ) : (
            <p>Yaklaşan mülakatınız bulunmuyor.</p>
          )}
        </section>

        <section className="management-card">
          <div className="section-heading">
            <h2>Son bildirimler</h2>
            <Link to="/portal/notifications">Tümünü gör</Link>
          </div>
          {data.notifications.length === 0 ? (
            <p>Henüz bildiriminiz yok.</p>
          ) : (
            <ul className="dashboard-notifications">
              {data.notifications.slice(0, 3).map((notification) => (
                <li key={notification.id}>
                  <span className={notification.readAt ? '' : 'unread-dot'} />
                  <div>
                    <strong>{notification.title}</strong>
                    <time dateTime={notification.createdAt}>
                      {formatDate(notification.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return formatTurkishDateTime(value);
}

function message(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data?.message ?? 'Portal bilgileri yüklenemedi.')
    : 'Portal bilgileri yüklenemedi.';
}
