export function readTurkishDateTime(data: FormData, name: string) {
  const [day, month, year] = String(data.get(`${name}Date`))
    .split('/')
    .map(Number);
  const [hour, minute] = String(data.get(`${name}Time`))
    .split(':')
    .map(Number);
  const value = new Date(year, month - 1, day, hour, minute);
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) {
    throw new Error('Tarih ve saati gg/aa/yyyy ve 24 saat biçiminde kontrol edin.');
  }
  return value.toISOString();
}

export function maskTurkishDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

export function maskTurkishTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return [digits.slice(0, 2), digits.slice(2, 4)].filter(Boolean).join(':');
}

export function formatTurkishDateTime(value: string) {
  const date = new Date(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTurkishDate(value: string) {
  const date = new Date(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function pad(value: number) {
  return String(value).padStart(2, '0');
}
