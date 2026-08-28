import { calendarTokens } from './Calendar.tokens';

export function CalendarEventLegend() {
  return <div className="calendar-legend">{Object.entries(calendarTokens.eventTypes).map(([key, value]) => <span key={key}><i style={{ background: value.color }} />{value.label}</span>)}</div>;
}
