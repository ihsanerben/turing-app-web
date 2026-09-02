import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="error-page">
      <section className="card">
        <p className="eyebrow">404</p>
        <h1>Sayfa bulunamadı</h1>
        <p>Adres değişmiş veya kaldırılmış olabilir.</p>
        <Link className="button-link" to="/">
          Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}
