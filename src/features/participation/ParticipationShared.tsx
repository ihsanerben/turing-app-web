import { useEffect, useState } from 'react';
import { participationApi, type Page, type Participant } from './participationApi';
import { participationError } from './participationPresentation';

export function Pagination({
  page,
  totalPages,
  disabled = false,
  onChange,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages < 2) return null;
  return (
    <nav className="participation-pagination" aria-label="Sayfalama">
      <button
        type="button"
        className="participation-secondary"
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
      >
        Önceki
      </button>
      <span>
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="participation-secondary"
        disabled={disabled || page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sonraki
      </button>
    </nav>
  );
}

export function Participants({ id, title }: { id: string; title: string }) {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<Page<Participant> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    participationApi
      .participants(id, page)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch((error) => {
        if (active) setError(participationError(error));
      });
    return () => {
      active = false;
    };
  }, [id, page]);
  return (
    <section className="participation-participants" aria-label={`${title} katılımcıları`}>
      <h2>{title} — Katılımcılar</h2>
      {error && <p role="alert">{error}</p>}
      {!result && !error && <p role="status">Katılımcılar yükleniyor…</p>}
      {result && (
        <>
          <p>{result.totalElements} öğrenci</p>
          {result.content.length === 0 ? (
            <p>Henüz katılım kaydı yok.</p>
          ) : (
            <ul>
              {result.content.map((value) => (
                <li key={value.userId}>
                  {value.firstName} {value.lastName}
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={page}
            totalPages={result.totalPages}
            onChange={(value) => {
              setResult(null);
              setError('');
              setPage(value);
            }}
          />
        </>
      )}
    </section>
  );
}
