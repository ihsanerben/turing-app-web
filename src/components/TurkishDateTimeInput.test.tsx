import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TurkishDateTimeInput } from './TurkishDateTimeInput';

describe('TurkishDateTimeInput', () => {
  it('formats compact date and time input while typing', () => {
    render(<TurkishDateTimeInput name="startsAt" label="Başlangıç" />);

    fireEvent.change(screen.getByLabelText('Tarih'), { target: { value: '10092026' } });
    fireEvent.change(screen.getByLabelText('Saat'), { target: { value: '1430' } });

    expect(screen.getByLabelText('Tarih')).toHaveValue('10/09/2026');
    expect(screen.getByLabelText('Saat')).toHaveValue('14:30');
  });
});
