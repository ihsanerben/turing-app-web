import { maskTurkishDate } from './turkishDateTime';

export function TurkishDateInput({
  id,
  value,
  onChange,
  required = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      inputMode="numeric"
      placeholder="gg/aa/yyyy"
      pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}"
      maxLength={10}
      required={required}
      value={value}
      onChange={(event) => onChange(maskTurkishDate(event.target.value))}
    />
  );
}
