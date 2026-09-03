import { pad } from './turkishDateTime';

export function TurkishDateTimeInput({
  name,
  label,
  defaultValue = '',
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const initial = defaultValue ? new Date(defaultValue) : null;
  const date = initial
    ? `${pad(initial.getDate())}/${pad(initial.getMonth() + 1)}/${initial.getFullYear()}`
    : '';
  const time = initial ? `${pad(initial.getHours())}:${pad(initial.getMinutes())}` : '';
  return (
    <fieldset className="date-time-field">
      <legend>{label}</legend>
      <label>
        Tarih
        <input
          name={`${name}Date`}
          inputMode="numeric"
          placeholder="gg/aa/yyyy"
          pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}"
          defaultValue={date}
          required
        />
      </label>
      <label>
        Saat
        <input
          name={`${name}Time`}
          inputMode="numeric"
          placeholder="ss:dd"
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          defaultValue={time}
          required
        />
      </label>
    </fieldset>
  );
}
