import axios from 'axios';
import { type FormEvent, useEffect, useState } from 'react';
import { formatTurkishDateTime } from '../../components/turkishDateTime';
import { auditApi, type AuditLogPage } from './auditApi';

const emptyFilters = { action: '', entityType: '', actorId: '', entityId: '', direction: 'desc' };

export function AdminAuditPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [query, setQuery] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      size: '20',
      direction: query.direction,
    });
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'direction' && value.trim()) params.set(key, value.trim());
    });
    auditApi
      .list(params)
      .then((value) => {
        if (active) setResult(value);
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
  }, [page, query]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setPage(0);
    setQuery(filters);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError('');
    setPage(nextPage);
  }

  return (
    <section className="admin-workspace audit-workspace">
      <p className="eyebrow">Güvenlik ve izlenebilirlik</p>
      <h1>Audit kayıtları</h1>
      <p>Yönetim işlemlerini aktör, işlem ve hedef kayıt üzerinden inceleyin.</p>

      <form className="management-card audit-filters" onSubmit={submit}>
        <label>
          İşlem
          <input
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            placeholder="Örn. APPLICATION_STATUS_CHANGED"
          />
        </label>
        <label>
          Varlık türü
          <input
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            placeholder="Örn. APPLICATION"
          />
        </label>
        <label>
          Aktör ID
          <input
            value={filters.actorId}
            onChange={(e) => setFilters({ ...filters, actorId: e.target.value })}
          />
        </label>
        <label>
          Varlık ID
          <input
            value={filters.entityId}
            onChange={(e) => setFilters({ ...filters, entityId: e.target.value })}
          />
        </label>
        <label>
          Sıralama
          <select
            value={filters.direction}
            onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
          >
            <option value="desc">En yeni önce</option>
            <option value="asc">En eski önce</option>
          </select>
        </label>
        <button type="submit">Filtrele</button>
      </form>

      {loading ? <p role="status">Audit kayıtları yükleniyor…</p> : null}
      {error ? (
        <p role="alert" className="status status--error">
          {error}
        </p>
      ) : null}
      {!loading && !error && result?.content.length === 0 ? (
        <p>Kriterlere uygun audit kaydı bulunamadı.</p>
      ) : null}
      {result && result.content.length > 0 ? (
        <div className="audit-list" aria-label="Audit kayıt listesi">
          {result.content.map((log) => (
            <details className="management-card audit-entry" key={log.id}>
              <summary>
                <span>
                  <strong>{log.action}</strong>
                  <small>
                    {log.entityType} · {log.entityId}
                  </small>
                </span>
                <span>
                  <strong>{log.actorName}</strong>
                  <small>{formatDate(log.createdAt)}</small>
                </span>
              </summary>
              <dl className="audit-metadata">
                <div>
                  <dt>Aktör</dt>
                  <dd>
                    {log.actorEmail} ({log.actorId})
                  </dd>
                </div>
                <div>
                  <dt>İstek ID</dt>
                  <dd>{log.requestId ?? '—'}</dd>
                </div>
                <div>
                  <dt>IP referansı</dt>
                  <dd>{log.ipReference ?? '—'}</dd>
                </div>
              </dl>
              <div className="audit-values">
                <section>
                  <h2>Önceki değer</h2>
                  <pre>{formatJson(log.oldValues)}</pre>
                </section>
                <section>
                  <h2>Yeni değer</h2>
                  <pre>{formatJson(log.newValues)}</pre>
                </section>
              </div>
            </details>
          ))}
        </div>
      ) : null}
      {result && result.totalPages > 1 ? (
        <nav className="pagination" aria-label="Audit sayfaları">
          <button type="button" disabled={page === 0} onClick={() => changePage(page - 1)}>
            Önceki
          </button>
          <span>
            {page + 1} / {result.totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= result.totalPages}
            onClick={() => changePage(page + 1)}
          >
            Sonraki
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  return formatTurkishDateTime(value);
}

function formatJson(value: unknown) {
  return value == null ? '—' : JSON.stringify(value, null, 2);
}

function message(error: unknown) {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : 'Audit kayıtları yüklenemedi. Lütfen yeniden deneyin.';
}
