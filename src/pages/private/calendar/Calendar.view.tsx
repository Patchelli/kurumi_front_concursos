import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/dialog/ConfirmDialog';
import { logoutMethod } from '../../../utils/logoutMethod';
import { UserMenu } from '@components/layout/UserMenu';
import { calendarTokens } from './Calendar.tokens';
import type { CalendarEvent } from './Calendar.type';

const KEY = 'kurumi_calendar_events';
const labels = Object.fromEntries(Object.entries(calendarTokens.eventTypes).map(([key, value]) => [key, value.label])) as Record<CalendarEvent['type'], string>;
const colors = Object.fromEntries(Object.entries(calendarTokens.eventTypes).map(([key, value]) => [key, value.color])) as Record<CalendarEvent['type'], string>;
function readEvents(): CalendarEvent[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function iso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export default function Calendar() {
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('kurumi_concursos_user') || '{}'); } catch { return {}; } }, []);
  const [cursor, setCursor] = useState(() => new Date()); const [events, setEvents] = useState(readEvents); const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<CalendarEvent>({ id: '', date: iso(new Date()), title: '', type: 'lembrete', note: '' });
  const year = cursor.getFullYear(), month = cursor.getMonth(); const first = new Date(year, month, 1); const days = new Date(year, month + 1, 0).getDate();
  const monthEvents = events.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).sort((a,b) => a.date.localeCompare(b.date));
  const cells = Array.from({ length: (first.getDay()+6)%7 + days }, (_, i) => i < (first.getDay()+6)%7 ? null : i - (first.getDay()+6)%7 + 1);
  function save(next: CalendarEvent[]) { setEvents(next); localStorage.setItem(KEY, JSON.stringify(next)); }
  function submit(e: React.FormEvent) { e.preventDefault(); if (!draft.title.trim() || !draft.date) return; const event = { ...draft, title: draft.title.trim(), id: draft.id || crypto.randomUUID() }; save(draft.id ? events.map(item => item.id === draft.id ? event : item) : [...events, event]); setOpen(false); setDraft({ ...draft, id: '', title: '', note: '' }); }
  function editEvent(event: CalendarEvent) { setDraft({ ...event }); setOpen(true); }
  function confirmDelete(event: CalendarEvent) {
    setDeleteTarget(event);
  }
  const firstName = user.name?.trim().split(' ')[0] || 'estudante';
  return <div className="journey-hub"><header className="hub-topbar"><a className="hub-brand" href="/" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></a><nav className="hub-nav" aria-label="Navegação principal"><a href="/">Jornadas</a><a className="active" href="/calendario">Calendário</a><button type="button" disabled>Desempenho</button></nav><UserMenu firstName={firstName} onLogout={logoutMethod} /></header>
    <div className="agenda-page"><header className="agenda-header"><div><span className="agenda-eyebrow">ORGANIZAÇÃO</span><h1>Calendário</h1><p>Datas importantes dos seus concursos e da sua rotina de estudos.</p></div><button className="agenda-primary" onClick={() => { setDraft({ ...draft, date: iso(new Date()) }); setOpen(true); }}>＋ Novo evento</button></header>
      <section className="agenda-layout"><div className="agenda-calendar"><div className="agenda-calendar-head"><button onClick={() => setCursor(new Date(year, month-1, 1))}>‹</button><h2>{cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><button onClick={() => setCursor(new Date(year, month+1, 1))}>›</button></div><div className="agenda-week">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <span key={d}>{d}</span>)}</div><div className="agenda-grid">{cells.map((day, i) => { const date = day ? iso(new Date(year, month, day)) : ''; const dayEvents = events.filter(e => e.date === date); return <button key={i} className={`agenda-day${date === iso(new Date()) ? ' today' : ''}${!day ? ' blank' : ''}`} disabled={!day} onClick={() => { setDraft({ ...draft, date }); setOpen(true); }}><strong>{day || ''}</strong>{dayEvents.slice(0,3).map(ev => <i key={ev.id} style={{ background: colors[ev.type] }}>{ev.title}</i>)}{dayEvents.length > 3 && <small>+{dayEvents.length-3}</small>}</button>; })}</div></div>
        <aside className="agenda-list"><div className="agenda-list-head"><div><span className="agenda-eyebrow">ESTE MÊS</span><h2>Próximas datas</h2></div><span>{monthEvents.length}</span></div>{monthEvents.length ? monthEvents.map(ev => <article className="agenda-event" key={ev.id}><time>{new Date(`${ev.date}T12:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','')}</time><div><b>{ev.title}</b><small style={{ color: colors[ev.type] }}>{labels[ev.type]}{ev.note ? ` · ${ev.note}` : ''}</small></div><button className="agenda-edit" onClick={() => editEvent(ev)} aria-label={`Editar ${ev.title}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Zm9.5-12.5 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button><button onClick={() => confirmDelete(ev)}>×</button></article>) : <div className="agenda-empty"><span>□</span><b>Nenhuma data neste mês</b><p>Cadastre a prova, boleto, edital ou qualquer lembrete importante.</p><button onClick={() => setOpen(true)}>Adicionar primeira data</button></div>}</aside></section>
    </div>{open && <div className="agenda-dialog-backdrop" onMouseDown={e => e.currentTarget === e.target && setOpen(false)}><form className="agenda-dialog" onSubmit={submit}><button type="button" className="agenda-close" onClick={() => setOpen(false)}>×</button><span className="agenda-eyebrow">{draft.id ? 'EDITAR DATA' : 'NOVA DATA'}</span><h2>{draft.id ? 'Editar evento' : 'Adicionar evento'}</h2><label>Título<input autoFocus value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Prova SEFAZ" /></label><div className="agenda-form-row"><label>Data<input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label><label>Tipo<select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as CalendarEvent['type'] })}>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label>Observação (opcional)<textarea value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} placeholder="Ex.: pagar até 18h" /></label><button className="agenda-primary" type="submit">Salvar evento</button></form></div>}
    <ConfirmDialog open={Boolean(deleteTarget)} title="Excluir evento?" description={`“${deleteTarget?.title ?? ''}” será removido do calendário.`} confirmLabel="Excluir" danger onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { save(events.filter(item => item.id !== deleteTarget.id)); toast.success('Evento excluído.'); } setDeleteTarget(null); }} />
  </div>;
}








