import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MealsPage } from './MealsPage';
import { EventsPage } from './EventsPage';
import { participationApi, type Activity, type MealWeek, type Page } from './participationApi';
import { mealDate } from './participationPresentation';

vi.mock('./participationApi', () => ({
  participationApi: {
    weeks: vi.fn(),
    week: vi.fn(),
    events: vi.fn(),
    saveMeals: vi.fn(),
    saveEvents: vi.fn(),
    participants: vi.fn(),
    updateWeek: vi.fn(),
    updateEvent: vi.fn(),
    createWeek: vi.fn(),
    createEvent: vi.fn(),
  },
}));
const page = <T,>(content: T[]): Page<T> => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  sort: '',
});
const day: Activity = {
  id: 'day-1',
  title: 'Yemek',
  description: 'Çorba',
  date: '2026-09-14',
  startsAt: null,
  location: '',
  attending: false,
  registrationOpen: true,
  version: 0,
};
const week: MealWeek = {
  id: 'week-1',
  weekStart: '2026-09-14',
  scheduleVersion: 0,
  days: [day, { ...day, id: 'day-2', date: '2026-09-16' }],
  version: 0,
};
const event: Activity = {
  ...day,
  id: 'event-1',
  title: 'Müze gezisi',
  date: null,
  startsAt: '2026-09-14T10:00:00Z',
  location: 'İstanbul',
};

describe('meal and event participation', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(participationApi.weeks).mockResolvedValue(
      page([{ id: week.id, weekStart: week.weekStart }]),
    );
    vi.mocked(participationApi.week).mockResolvedValue(week);
    vi.mocked(participationApi.events).mockResolvedValue({ events: page([event]), version: 0 });
    vi.mocked(participationApi.saveMeals).mockResolvedValue({ version: 1, changed: true });
    vi.mocked(participationApi.saveEvents).mockResolvedValue({ version: 1, changed: true });
    vi.mocked(participationApi.participants).mockResolvedValue(
      page([{ userId: 'student', firstName: 'Ayşe', lastName: 'Yılmaz' }]),
    );
  });

  it('stages meal selections and sends them only on save, then supports cancellation', async () => {
    render(<MealsPage />);
    const choice = await screen.findByRole('button', { name: `${mealDate(day.date!)}: Geleceğim` });
    fireEvent.click(choice);
    expect(choice).toHaveAttribute('aria-pressed', 'true');
    expect(participationApi.saveMeals).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Yemek haftası' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByText(/Seçimleriniz kaydedildi/)).toBeInTheDocument();
    expect(participationApi.saveMeals).toHaveBeenCalledWith('week-1', ['day-1'], 0);
    expect(screen.getByRole('button', { name: 'Güncelle' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Güncelle' })).toHaveClass('action-update');
    fireEvent.click(choice);
    fireEvent.click(screen.getByRole('button', { name: 'Güncelle' }));
    await waitFor(() =>
      expect(participationApi.saveMeals).toHaveBeenLastCalledWith('week-1', [], 1),
    );
  });

  it('keeps staged meal choices when saving fails and offers reload', async () => {
    vi.mocked(participationApi.saveMeals).mockRejectedValue(
      new Error('Seçimler başka bir sekmede güncellendi.'),
    );
    render(<MealsPage />);
    const choice = await screen.findByRole('button', { name: `${mealDate(day.date!)}: Geleceğim` });
    fireEvent.click(choice);
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('başka bir sekmede');
    expect(choice).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Güncel kayıtları yükle' }));
    expect(
      await screen.findByRole('button', { name: `${mealDate(day.date!)}: Geleceğim` }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows day participants to admins and omits student selection controls', async () => {
    render(<MealsPage admin />);
    fireEvent.click(
      await screen.findByRole('button', { name: `${mealDate(day.date!)} katılımcıları` }),
    );
    expect(await screen.findByText('Ayşe Yılmaz')).toBeInTheDocument();
    expect(participationApi.participants).toHaveBeenCalledWith('day-1', 0);
    expect(
      within(screen.getByRole('dialog', { name: 'Yemek katılımcıları' })).getByText('Ayşe Yılmaz'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kapat' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kaydet' })).not.toBeInTheDocument();
  });

  it('batches event changes, disables duplicate submit and preserves other-page selections', async () => {
    let resolve!: (value: { version: number; changed: boolean }) => void;
    vi.mocked(participationApi.saveEvents).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    vi.mocked(participationApi.events).mockResolvedValue({
      events: { ...page([event]), totalPages: 2 },
      version: 4,
    });
    render(<EventsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Müze gezisi: Katılacağım' }));
    expect(participationApi.saveEvents).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sonraki' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Güncelle' }));
    expect(screen.getByRole('button', { name: 'Kaydediliyor…' })).toBeDisabled();
    expect(participationApi.saveEvents).toHaveBeenCalledExactlyOnceWith(
      [{ eventId: 'event-1', attending: true }],
      4,
    );
    resolve({ version: 5, changed: true });
    expect(await screen.findByText(/Katılım seçimleriniz kaydedildi/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sonraki' })).toBeEnabled();
  });

  it('disables expired participation while retaining previously saved attendance', async () => {
    vi.mocked(participationApi.events).mockResolvedValue({
      events: page([{ ...event, attending: true, registrationOpen: false }]),
      version: 1,
    });
    render(<EventsPage />);
    const choice = await screen.findByRole('button', { name: 'Müze gezisi: Katılacağım' });
    expect(choice).toBeDisabled();
    expect(choice).toHaveAttribute('aria-pressed', 'true');
  });

  it('creates events with Turkey time and lists participant names', async () => {
    vi.mocked(participationApi.createEvent).mockResolvedValue(event);
    render(<EventsPage admin />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yeni etkinlik aç' }));
    expect(screen.getByRole('dialog', { name: 'Yeni etkinlik' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Etkinlik adı' }), {
      target: { value: 'Yeni gezi' },
    });
    const time = within(screen.getByRole('group', { name: 'Başlangıç (Türkiye saati)' }));
    fireEvent.change(time.getByRole('textbox', { name: 'Tarih' }), {
      target: { value: '14092026' },
    });
    fireEvent.change(time.getByRole('textbox', { name: 'Saat' }), { target: { value: '1300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() =>
      expect(participationApi.createEvent).toHaveBeenCalledWith({
        title: 'Yeni gezi',
        description: '',
        location: '',
        startsAt: '2026-09-14T10:00:00.000Z',
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Müze gezisi katılımcıları' }));
    expect(await screen.findByText('Ayşe Yılmaz')).toBeInTheDocument();
  });

  it('creates a meal week with days only and a blue save button', async () => {
    vi.mocked(participationApi.createWeek).mockResolvedValue(week);
    render(<MealsPage admin />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yeni yemek haftası aç' }));
    expect(screen.getByRole('dialog', { name: 'Yeni yemek haftası' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Hafta başlangıcı (pazartesi)' }), {
      target: { value: '14092026' },
    });
    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
    expect(screen.queryByRole('textbox', { name: /Menü/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kaydet' })).toHaveClass('action-save');
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() =>
      expect(participationApi.createWeek).toHaveBeenCalledWith({
        weekStart: '2026-09-14',
        days: Array.from({ length: 5 }, (_, i) => ({
          date: `2026-09-${14 + i}`,
        })),
      }),
    );
  });

  it('edits meal days in a popup and sends the schedule version', async () => {
    vi.mocked(participationApi.updateWeek).mockResolvedValue({ ...week, scheduleVersion: 1 });
    render(<MealsPage admin />);
    fireEvent.click(await screen.findByRole('button', { name: 'Haftayı düzenle' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Yemek haftasını düzenle' }));
    fireEvent.click(dialog.getByRole('checkbox', { name: mealDate('2026-09-15') }));
    expect(dialog.getByRole('button', { name: 'Güncelle' })).toHaveClass('action-update');
    fireEvent.click(dialog.getByRole('button', { name: 'Güncelle' }));
    await waitFor(() =>
      expect(participationApi.updateWeek).toHaveBeenCalledWith(week, [
        { date: '2026-09-14' },
        { date: '2026-09-15' },
        { date: '2026-09-16' },
      ]),
    );
    expect(await screen.findByText('Yemek haftası güncellendi.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads event fields for editing and retains the form on a failed update', async () => {
    vi.mocked(participationApi.updateEvent).mockRejectedValue(
      new Error('Kayıt başka bir işlemde güncellendi.'),
    );
    render(<EventsPage admin />);
    fireEvent.click(await screen.findByRole('button', { name: 'Müze gezisi düzenle' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Etkinliği düzenle' }));
    expect(dialog.getByRole('textbox', { name: 'Etkinlik adı' })).toHaveValue('Müze gezisi');
    expect(dialog.getByRole('textbox', { name: 'Saat' })).toHaveValue('13:00');
    fireEvent.change(dialog.getByRole('textbox', { name: 'Etkinlik adı' }), {
      target: { value: 'Yeni isim' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Güncelle' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent('başka bir işlemde');
    expect(participationApi.updateEvent).toHaveBeenCalledWith(
      event,
      expect.objectContaining({ title: 'Yeni isim', startsAt: '2026-09-14T10:00:00.000Z' }),
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows empty and failed-loading states', async () => {
    vi.mocked(participationApi.events).mockResolvedValue({ events: page([]), version: 0 });
    const view = render(<EventsPage />);
    expect(await screen.findByText('Henüz etkinlik oluşturulmadı.')).toBeInTheDocument();
    view.unmount();
    vi.mocked(participationApi.events).mockRejectedValue(new Error('Etkinlikler yüklenemedi.'));
    render(<EventsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Etkinlikler yüklenemedi.');
  });
});
