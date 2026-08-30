import type { ECalendarEventType } from '../../enum/ECalendarEventType';
export type CalendarEventResponse = { id: number; date: string; title: string; type: ECalendarEventType; note?: string | null };
