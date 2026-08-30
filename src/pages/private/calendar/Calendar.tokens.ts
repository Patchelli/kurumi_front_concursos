import { ECalendarEventType } from '../../../../@business/enum/ECalendarEventType';

export const calendarTokens = {
  eventTypes: {
    [ECalendarEventType.Exam]: { label: 'Prova', color: 'var(--error)' },
    [ECalendarEventType.Payment]: { label: 'Boleto', color: 'var(--tertiary)' },
    [ECalendarEventType.Notice]: { label: 'Edital', color: 'var(--primary)' },
    [ECalendarEventType.Registration]: { label: 'Inscrição', color: 'var(--secondary)' },
    [ECalendarEventType.Reminder]: { label: 'Lembrete', color: 'var(--primary)' },
  },
} as const;
