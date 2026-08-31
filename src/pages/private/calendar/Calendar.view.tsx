import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ECalendarEventType } from '@business/enum/ECalendarEventType';
import { calendarService } from '@business/service/Calendar.service';
import { ConfirmDialog } from '@components/dialog/ConfirmDialog';
import { UserMenu } from '@components/layout/UserMenu';
import { StudyLoading } from '@components/loading/StudyLoading';
import { getRequestErrorMessage } from '@utils/getRequestErrorMessage';
import { logoutMethod } from '@utils/logoutMethod';
import { calendarTokens } from './Calendar.tokens';
import type { CalendarEvent, CalendarEventDraft } from './Calendar.type';

const labels = Object.fromEntries(Object.entries(calendarTokens.eventTypes).map(([key, value]) => [key, value.label])) as Record<ECalendarEventType, string>;
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const normalizeDate = (d: string) => d.slice(0, 10);
const emptyDraft = (): CalendarEventDraft => ({ id: null, date: iso(new Date()), title: '', type: ECalendarEventType.Reminder, note: '' });

export default function CalendarView() {
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('kurumi_concursos_user') || '{}') as { name?: string }; } catch { return {}; } }, []);
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draft, setDraft] = useState<CalendarEventDraft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    let active = true;
    calendarService.findAll()
      .then(data => { if (active) setEvents(data.map(e => ({ ...e, date: normalizeDate(e.date) }))); })
      .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível carregar o calendário.')))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1), days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: offset + days }, (_, index) => index < offset ? null : index - offset + 1);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = events.filter(event => event.date.startsWith(monthPrefix)).sort((a, b) => a.date.localeCompare(b.date));

  function openNew(date = iso(new Date())) { setDraft({ ...emptyDraft(), date }); setOpen(true); }
  function editEvent(event: CalendarEvent) { setDraft({ ...event, note: event.note ?? '' }); setOpen(true); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date || saving) return;
    setSaving(true);
    const request = { date: draft.date, title: draft.title.trim(), type: draft.type, note: draft.note.trim() || null };
    try {
      if (draft.id === null) {
        const created = await calendarService.register(request);
        setEvents(current => [...current, { ...created, date: normalizeDate(created.date) }]);
      } else {
        const updated = await calendarService.update({ id: draft.id, ...request });
        if (!updated) throw new Error('Evento não atualizado.');
        setEvents(current => current.map(item => item.id === draft.id ? { id: draft.id!, ...request } : item));
      }
      setOpen(false);
      setDraft(emptyDraft());
      toast.success('Evento salvo.');
    } catch (error) { toast.error(getRequestErrorMessage(error, 'Não foi possível salvar o evento.')); }
    finally { setSaving(false); }
  }

  async function removeEvent(event: CalendarEvent) {
    setDeleteTarget(null);
    try {
      const removed = await calendarService.remove(event.id);
      if (!removed) throw new Error('Evento não excluído.');
      setEvents(current => current.filter(item => item.id !== event.id));
      toast.success('Evento excluído.');
    } catch (error) { toast.error(getRequestErrorMessage(error, 'Não foi possível excluir o evento.')); }
  }

  const firstName = user.name?.trim().split(' ')[0] || 'estudante';
  const t = calendarTokens;
  return <div className="journey-hub">
    <header className="hub-topbar"><a className="hub-brand" href="/inicio" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></a><nav className="hub-nav" aria-label="Navegação principal"><a href="/inicio">Jornadas</a><a className="active" href="/calendario">Calendário</a><button type="button" disabled>Desempenho</button></nav><UserMenu firstName={firstName} onLogout={logoutMethod} /></header>
    <div className={t.page}>
      <header className={t.header}><div><span className={t.eyebrow}>ORGANIZAÇÃO</span><h1 className={t.title}>Calendário</h1><p className={t.subtitle}>Datas importantes dos seus concursos e da sua rotina de estudos.</p></div><button className={t.primaryButton} onClick={() => openNew()}>＋ Novo evento</button></header>
      {loading ? <StudyLoading variant="section" label="Carregando calendário…" /> : <section className={t.layout}>
        <div className={t.surface}><div className={t.calendarHead}><button className={t.navButton} onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button><h2 className={t.calendarTitle}>{cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><button className={t.navButton} onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button></div><div className={t.week}>{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <span className={t.weekDay} key={day}>{day}</span>)}</div><div className={t.grid}>{cells.map((day, index) => { const date = day ? iso(new Date(year, month, day)) : ''; const dayEvents = events.filter(item => item.date === date); return <button key={index} className={`${t.day} ${date === iso(new Date()) ? t.dayToday : ''} ${!day ? t.dayBlank : ''}`} disabled={!day} onClick={() => openNew(date)}><strong className={t.dayNumber}>{day || ''}</strong>{dayEvents.slice(0, 3).map(item => <i key={item.id} className={`${t.eventPill} ${t.eventTypes[item.type].className}`}>{item.title}</i>)}{dayEvents.length > 3 && <small className={t.more}>+{dayEvents.length - 3}</small>}</button>; })}</div></div>
        <aside className={t.surface}><div className={t.listHead}><div><span className={t.eyebrow}>ESTE MÊS</span><h2 className={t.listTitle}>Próximas datas</h2></div><span className={t.count}>{monthEvents.length}</span></div>{monthEvents.length ? monthEvents.map(item => <article className={t.event} key={item.id}><time className={t.eventDate}>{new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}</time><div className={t.eventBody}><b className={t.eventTitle}>{item.title}</b><small className={t.eventMeta}><i className={`${t.eventTypeDot} ${t.eventTypes[item.type].className}`} />{labels[item.type]}{item.note ? ` · ${item.note}` : ''}</small></div><button className={t.iconButton} onClick={() => editEvent(item)} aria-label={`Editar ${item.title}`}><svg className={t.editIcon} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Zm9.5-12.5 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button><button className={`${t.iconButton} ${t.deleteButton}`} onClick={() => setDeleteTarget(item)}>×</button></article>) : <div className={t.empty}><span className={t.emptyIcon}>□</span><b className={t.emptyTitle}>Nenhuma data neste mês</b><p className={t.emptyText}>Cadastre a prova, boleto, edital ou qualquer lembrete importante.</p><button className={t.emptyButton} onClick={() => openNew()}>Adicionar primeira data</button></div>}</aside>
      </section>}
    </div>
    {open && <div className={t.backdrop} onMouseDown={event => event.currentTarget === event.target && setOpen(false)}><form className={t.dialog} onSubmit={submit}><button type="button" className={t.close} onClick={() => setOpen(false)}>×</button><span className={t.eyebrow}>{draft.id !== null ? 'EDITAR DATA' : 'NOVA DATA'}</span><h2 className={t.dialogTitle}>{draft.id !== null ? 'Editar evento' : 'Adicionar evento'}</h2><label className={t.label}>Título<input className={t.input} autoFocus value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Ex.: Prova SEFAZ" /></label><div className={t.formRow}><label className={t.label}>Data<input className={t.input} type="date" value={draft.date} onChange={event => setDraft(current => ({ ...current, date: event.target.value }))} /></label><label className={t.label}>Tipo<select className={t.input} value={draft.type} onChange={event => setDraft(current => ({ ...current, type: event.target.value as ECalendarEventType }))}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label className={t.label}>Observação (opcional)<textarea className={`${t.input} ${t.textarea}`} value={draft.note} onChange={event => setDraft(current => ({ ...current, note: event.target.value }))} placeholder="Ex.: pagar até 18h" /></label><button className={t.primaryButton} type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar evento'}</button></form></div>}
    <ConfirmDialog open={Boolean(deleteTarget)} title="Excluir evento?" description={`“${deleteTarget?.title ?? ''}” será removido do calendário.`} confirmLabel="Excluir" danger onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void removeEvent(deleteTarget); }} />
  </div>;
}
