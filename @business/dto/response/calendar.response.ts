import type { ECalendarEventType } from '../../enum/ECalendarEventType';
export type CalendarEventResponse = {
  id: number;
  date: string;
  title: string;
  type: ECalendarEventType;
  note?: string | null;
  managed?: boolean;
  journeyId?: number | null;
  knowledgeAreaId?: number | null;
  syllabusNodeId?: number | null;
};
