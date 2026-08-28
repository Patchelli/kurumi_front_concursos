import CalendarView from './Calendar.view';

/** Controller boundary kept separate so API/event persistence can evolve without coupling the view. */
export function CalendarController() {
  return <CalendarView />;
}

export default CalendarController;
