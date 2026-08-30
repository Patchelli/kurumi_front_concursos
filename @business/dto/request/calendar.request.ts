import type { ECalendarEventType } from '../../enum/ECalendarEventType';
export type CalendarEventRegisterRequest = { date: string; title: string; type: ECalendarEventType; note?: string | null };
export type CalendarEventUpdateRequest = CalendarEventRegisterRequest & { id: number };
