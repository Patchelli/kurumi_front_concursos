import { calendarTokens } from './Calendar.tokens';

export function CalendarEventLegend() {
  return <div className={calendarTokens.legend}>{Object.entries(calendarTokens.eventTypes).map(([key, value]) => <span className={calendarTokens.legendItem} key={key}><i className={`${calendarTokens.legendDot} ${value.className}`} />{value.label}</span>)}</div>;
}
