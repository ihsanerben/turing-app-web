import { apiClient } from '../../api/apiClient';

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
};
export type Activity = {
  id: string;
  title: string;
  description: string;
  date: string | null;
  startsAt: string | null;
  location: string;
  attending: boolean;
  registrationOpen: boolean;
  version: number;
};
export type MealWeekSummary = { id: string; weekStart: string };
export type MealWeek = MealWeekSummary & {
  days: Activity[];
  version: number;
  scheduleVersion: number;
};
export type Events = { events: Page<Activity>; version: number };
export type SelectionResult = { version: number; changed: boolean };
export type Participant = { userId: string; firstName: string; lastName: string };
export type MealWeekInput = { weekStart: string; days: { date: string }[] };
export type EventInput = { title: string; description: string; startsAt: string; location: string };
const base = (admin: boolean) => `/api/${admin ? 'admin' : 'me'}`;

export const participationApi = {
  weeks: (admin: boolean, page = 0) =>
    apiClient
      .get<Page<MealWeekSummary>>(`${base(admin)}/meal-weeks`, { params: { page } })
      .then((r) => r.data),
  week: (admin: boolean, id: string) =>
    apiClient.get<MealWeek>(`${base(admin)}/meal-weeks/${id}`).then((r) => r.data),
  createWeek: (body: MealWeekInput) =>
    apiClient.post<MealWeek>('/api/admin/meal-weeks', body).then((r) => r.data),
  updateWeek: (week: MealWeek, days: { date: string }[]) =>
    apiClient
      .put<MealWeek>(`/api/admin/meal-weeks/${week.id}`, { days, version: week.scheduleVersion })
      .then((r) => r.data),
  updateEvent: (event: Activity, body: EventInput) =>
    apiClient
      .put<Activity>(`/api/admin/events/${event.id}`, { ...body, version: event.version })
      .then((r) => r.data),
  saveMeals: (id: string, dayIds: string[], version: number) =>
    apiClient
      .put<SelectionResult>(`/api/me/meal-weeks/${id}/selection`, { dayIds, version })
      .then((r) => r.data),
  events: (admin: boolean, page = 0) =>
    apiClient.get<Events>(`${base(admin)}/events`, { params: { page } }).then((r) => r.data),
  createEvent: (body: EventInput) =>
    apiClient.post<Activity>('/api/admin/events', body).then((r) => r.data),
  saveEvents: (changes: { eventId: string; attending: boolean }[], version: number) =>
    apiClient
      .put<SelectionResult>('/api/me/events/selection', { changes, version })
      .then((r) => r.data),
  participants: (id: string, page = 0) =>
    apiClient
      .get<Page<Participant>>(`/api/admin/participation/${id}/participants`, { params: { page } })
      .then((r) => r.data),
};
