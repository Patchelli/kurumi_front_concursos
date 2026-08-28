export type CalendarEventType = 'prova' | 'boleto' | 'edital' | 'inscricao' | 'lembrete';
export type CalendarEvent = { id: string; date: string; title: string; type: CalendarEventType; note: string };
