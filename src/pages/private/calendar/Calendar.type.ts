import type { ECalendarEventType } from '@business/enum/ECalendarEventType';
export type CalendarEvent = {
  id: number; date: string; title: string; type: ECalendarEventType; note?: string | null;
  managed?: boolean; journeyId?: number | null; knowledgeAreaId?: number | null; syllabusNodeId?: number | null;
};
export type CalendarEventDraft = { id: number | null; date: string; title: string; type: ECalendarEventType; note: string };
