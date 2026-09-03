import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatTurkishDate } from '../../components/turkishDateTime';
import { publicContentApi } from './publicContentApi';
import { useAppConfig } from '../appConfig/appConfigContextValue';
function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    load()
      .then((v) => {
        if (active) setData(v);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [load]);
  return { data, error };
}
export function HomePage() {
  const { config } = useAppConfig();
  return (
    <section className="public-page hero">
      <p className="eyebrow">{config.applicationName}</p>
      <h1>{config.tagline}</h1>
      <p>
        Öğrencilerin eğitim yolculuğuna sürdürülebilir destek sağlıyor, fırsat eşitliğini birlikte
        büyütüyoruz.
      </p>
      <div className="public-actions">
        <Link className="button-link" to="/scholarships">
          Başvuruları incele
        </Link>
        <Link className="button-link secondary" to="/about">
          Hakkımızda
        </Link>
      </div>
      <div className="public-highlights" aria-label="Başvuru süreci">
        <article>
          <strong>Şeffaf süreç</strong>
          <span>Başvurunu tek ekrandan oluştur ve adım adım takip et.</span>
        </article>
        <article>
          <strong>Eğitime destek</strong>
          <span>Güncel başvuru programlarını ve katılım koşullarını kolayca incele.</span>
        </article>
        <article>
          <strong>Güvenli başvuru</strong>
          <span>Belgelerini güvenle yükle, bildirimlerini zamanında al.</span>
        </article>
      </div>
    </section>
  );
}
export function ScholarshipsPage() {
  const load = useCallback(() => publicContentApi.scholarships(), []);
  const { data, error } = useLoad(load);
  return (
    <PublicList title="Başvuru programları" error={error}>
      {!error && data?.length === 0 ? (
        <p className="empty-state">Yeni başvuru programları yakında burada yayınlanacak.</p>
      ) : null}
      {data?.map((v) => (
        <article key={v.program.id}>
          <h2>{v.program.name}</h2>
          <p>{v.program.description}</p>
          <p>{v.periods.length} başvuru dönemi</p>
          <Link to={`/scholarships/${v.program.slug}`}>Programı incele</Link>
        </article>
      ))}
    </PublicList>
  );
}
export function ScholarshipDetailPage() {
  const { slug = '' } = useParams();
  const load = useCallback(() => publicContentApi.scholarship(slug), [slug]);
  const { data, error } = useLoad(load);
  return (
    <PublicList title={data?.program.name ?? 'Başvuru programı'} error={error}>
      {data && (
        <>
          <p>{data.program.description}</p>
          {data.periods.map((p) => (
            <article key={p.id}>
              <h2>{p.name}</h2>
              <p>
                {p.academicYear} · {p.status}
              </p>
              <p>
                {format(p.startsAt)} – {format(p.endsAt)}
              </p>
              {p.status === 'OPEN' && <Link to="/login">Başvuru yapmak için giriş yap</Link>}
            </article>
          ))}
        </>
      )}
    </PublicList>
  );
}
export function AnnouncementsPage() {
  const load = useCallback(() => publicContentApi.announcements(), []);
  const { data, error } = useLoad(load);
  return (
    <PublicList title="Duyurular" error={error}>
      {!error && data?.length === 0 ? (
        <p className="empty-state">Henüz yayınlanmış bir duyuru bulunmuyor.</p>
      ) : null}
      {data?.map((v) => (
        <article key={v.id}>
          <time>{v.publishedAt && format(v.publishedAt)}</time>
          <h2>{v.title}</h2>
          <p>{v.summary}</p>
          <Link to={`/announcements/${v.slug}`}>Devamını oku</Link>
        </article>
      ))}
    </PublicList>
  );
}
export function AnnouncementDetailPage() {
  const { slug = '' } = useParams();
  const load = useCallback(() => publicContentApi.announcement(slug), [slug]);
  const { data, error } = useLoad(load);
  return (
    <PublicList title={data?.title ?? 'Duyuru'} error={error}>
      {data && (
        <article>
          <time>{data.publishedAt && format(data.publishedAt)}</time>
          <p className="content-text">{data.content}</p>
        </article>
      )}
    </PublicList>
  );
}
export function AboutPage() {
  const { config } = useAppConfig();
  return (
    <PublicList title="Hakkımızda">
      <p>
        {config.applicationName}, köklü kurumsal birikimini toplumsal faydaya dönüştürerek
        öğrencilerin eğitim yolculuğunu destekler.
      </p>
      <div className="about-grid">
        <article>
          <h2>Amacımız</h2>
          <p>Eğitimde fırsat eşitliğine katkı sunmak ve gençlerin potansiyelini güçlendirmek.</p>
        </article>
        <article>
          <h2>Yaklaşımımız</h2>
          <p>Başvurudan değerlendirmeye kadar açık, güvenilir ve izlenebilir bir süreç yürütmek.</p>
        </article>
      </div>
    </PublicList>
  );
}
export function ContactPage() {
  const { config } = useAppConfig();
  return (
    <PublicList title="İletişim">
      <p>
        Başvuru süreçleriyle ilgili sorularınız için{' '}
        <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a> adresinden bize
        ulaşabilirsiniz.
      </p>
      {config.supportPhone ? <p>Telefon: {config.supportPhone}</p> : null}
      {config.contactAddress ? <address>{config.contactAddress}</address> : null}
    </PublicList>
  );
}
function PublicList({
  title,
  error = false,
  children,
}: {
  title: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  const { config } = useAppConfig();
  return (
    <section className="public-page">
      <p className="eyebrow">{config.applicationName}</p>
      <h1>{title}</h1>
      {error ? (
        <p role="alert">İçerik yüklenemedi.</p>
      ) : (
        <div className="public-list">{children}</div>
      )}
    </section>
  );
}
function format(v: string) {
  return formatTurkishDate(v);
}
