import { formatTurkishDateTime } from '../../components/turkishDateTime';
import type { Period, Program } from './scholarshipApi';

export function ProgramListContent({
  program,
  period,
  now,
  archived = false,
}: {
  program: Program;
  period: Period | null | undefined;
  now: number;
  archived?: boolean;
}) {
  return (
    <>
      <span className="program-card-main">
        <strong>{program.name}</strong>
        <code className="program-id">Program ID: {program.id}</code>
        <small>
          Başlangıç: {period ? formatTurkishDateTime(period.startsAt) : 'Henüz belirlenmedi'}
        </small>
      </span>
      <ProgramState period={period} now={now} archived={archived} />
    </>
  );
}

export function ProgramState({
  period,
  now,
  detailed = false,
  archived = false,
}: {
  period: Period | null | undefined;
  now: number;
  detailed?: boolean;
  archived?: boolean;
}) {
  const finished =
    period?.status === 'CLOSED' || period?.status === 'COMPLETED' || period?.status === 'ARCHIVED';
  const active = period?.status === 'OPEN' || period?.status === 'SCHEDULED';
  const className = archived
    ? 'program-state program-state--archived'
    : finished
      ? 'program-state program-state--finished'
      : active
        ? 'program-state program-state--active'
        : 'program-state program-state--draft';
  const title = archived
    ? 'Program arşivde'
    : finished
      ? 'Program bitti'
      : active
        ? 'Program aktif'
        : 'Program taslakta';
  let explanation = archived
    ? 'Yönetim ekranları dışında gizli'
    : finished
      ? 'Başvuru alımı kapalı'
      : 'Henüz yayınlanmadı';

  if (!archived && active && period) {
    const days = Math.max(0, Math.ceil((new Date(period.endsAt).getTime() - now) / 86_400_000));
    explanation =
      period.status === 'SCHEDULED' ? 'Başlangıç tarihi bekleniyor' : `${days} gün kaldı`;
  }

  return (
    <span className={className} role={detailed ? 'status' : undefined}>
      <strong>{title}</strong>
      <small>{explanation}</small>
      {detailed && period && (
        <small>
          {formatTurkishDateTime(period.startsAt)} – {formatTurkishDateTime(period.endsAt)}
        </small>
      )}
    </span>
  );
}
