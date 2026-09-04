import type { Period } from './scholarshipApi';

export function latestProgramPeriod(periods: Period[]) {
  return (
    [...periods].sort(
      (left, right) => new Date(right.endsAt).getTime() - new Date(left.endsAt).getTime(),
    )[0] ?? null
  );
}
