import { ECalendarEventType } from '@business/enum/ECalendarEventType';

const eventTypes = {
  [ECalendarEventType.Exam]: { label: 'Prova', className: 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]' },
  [ECalendarEventType.Payment]: { label: 'Boleto', className: 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]' },
  [ECalendarEventType.Notice]: { label: 'Edital', className: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' },
  [ECalendarEventType.Registration]: { label: 'Inscrição', className: 'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]' },
  [ECalendarEventType.Reminder]: { label: 'Lembrete', className: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' },
} as const;

export const calendarTokens = {
  eventTypes,
  legend: 'flex flex-wrap items-center gap-3 text-[11px] text-[var(--md-sys-color-on-surface-variant)]',
  legendItem: 'inline-flex items-center gap-1.5',
  legendDot: 'h-2.5 w-2.5 rounded-full',
  page: 'mx-auto max-w-[1240px] px-4 py-6 text-[var(--md-sys-color-on-surface)] md:px-11 md:py-10',
  header: 'mb-8 flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between',
  eyebrow: 'text-[11px] font-extrabold tracking-[.12em] text-[var(--md-sys-color-primary)]',
  title: 'my-1.5 text-[32px] font-bold tracking-[-.03em]',
  subtitle: 'm-0 text-[var(--md-sys-color-on-surface-variant)]',
  primaryButton: 'inline-flex items-center justify-center rounded-xl border-0 bg-[var(--md-sys-color-primary)] px-[18px] py-3 font-extrabold text-[var(--md-sys-color-on-primary)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-55',
  layout: 'grid grid-cols-1 gap-[22px] min-[801px]:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]',
  surface: 'rounded-[18px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-bright)] p-3.5 shadow-[0_5px_20px_#3b24520b] md:p-[22px]',
  calendarHead: 'flex items-center justify-between',
  calendarTitle: 'm-0 text-[19px] font-bold capitalize',
  navButton: 'grid h-[34px] w-[34px] place-items-center rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-2xl text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]',
  week: 'my-2 mt-6 grid grid-cols-7 gap-[7px]', weekDay: 'text-center text-[11px] font-extrabold text-[var(--md-sys-color-outline)]', grid: 'grid grid-cols-7 gap-[7px]',
  day: 'flex min-h-[70px] min-w-0 flex-col gap-1 rounded-[10px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-bright)] p-2 text-left hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface)] md:min-h-[91px]',
  dayBlank: 'cursor-default border-0 bg-transparent hover:border-0 hover:bg-transparent', dayToday: 'shadow-[inset_0_3px_var(--md-sys-color-primary)]', dayNumber: 'text-xs text-[var(--md-sys-color-on-surface-variant)]',
  eventPill: 'overflow-hidden text-ellipsis whitespace-nowrap rounded px-1 py-[3px] text-[9px] not-italic md:text-[10px]', more: 'text-[10px] text-[var(--md-sys-color-primary)]',
  listHead: 'flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-[18px]', listTitle: 'mt-1.5 text-[19px] font-bold', count: 'rounded-full bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 text-xs font-extrabold text-[var(--md-sys-color-on-primary-container)]',
  event: 'flex items-center gap-[13px] border-b border-[var(--md-sys-color-outline-variant)] px-0.5 py-4', eventDate: 'w-12 text-xs font-extrabold text-[var(--md-sys-color-primary)]', eventBody: 'flex min-w-0 flex-1 flex-col gap-1', eventTitle: 'truncate text-sm', eventMeta: 'truncate text-[11px] text-[var(--md-sys-color-on-surface-variant)]', eventTypeDot: 'mr-1.5 inline-block h-2 w-2 rounded-full',
  iconButton: 'grid h-8 w-8 shrink-0 place-items-center border-0 bg-transparent text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)]', editIcon: 'h-4 w-4', deleteButton: 'text-xl hover:text-[var(--md-sys-color-error)]',
  empty: 'px-6 py-14 text-center text-[var(--md-sys-color-on-surface-variant)]', emptyIcon: 'block text-3xl text-[var(--md-sys-color-primary)]', emptyTitle: 'mt-3 block text-[var(--md-sys-color-on-surface)]', emptyText: 'text-[13px] leading-[1.45]', emptyButton: 'border-0 bg-transparent font-extrabold text-[var(--md-sys-color-primary)]',
  backdrop: 'fixed inset-0 z-20 grid place-items-center bg-[#21152e66] p-5', dialog: 'relative flex w-full max-w-[480px] flex-col gap-4 rounded-[18px] bg-[var(--md-sys-color-surface-bright)] p-7 shadow-[0_20px_70px_#21152e44]', close: 'absolute right-4 top-3 border-0 bg-transparent text-[26px] text-[var(--md-sys-color-outline)]', dialogTitle: 'mb-1 mt-0 text-2xl font-bold',
  label: 'flex flex-col gap-1.5 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]', input: 'rounded-[9px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-bright)] p-2.5 text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)]', textarea: 'min-h-[70px] resize-y', formRow: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
} as const;
