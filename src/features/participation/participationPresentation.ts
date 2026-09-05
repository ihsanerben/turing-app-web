import axios from 'axios';

export function participationError(error: unknown) {
  if (axios.isAxiosError(error))
    return error.response?.data?.message ?? 'İşlem tamamlanamadı. Yeniden deneyin.';
  return error instanceof Error ? error.message : 'İşlem tamamlanamadı. Yeniden deneyin.';
}

export function mealDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'full',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(`${value}T12:00:00+03:00`));
}

export function eventDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(value));
}

export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    throw new Error('Geçerli bir tarih girin.');
  return date;
}
