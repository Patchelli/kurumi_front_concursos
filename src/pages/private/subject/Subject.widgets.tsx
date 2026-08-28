import { useState } from 'react';
import { toast } from 'sonner';
import type { SyllabusNodeResponse } from '../../../../@business/dto/response/journey.response';

const unavail = (feature: string) => toast.info(`${feature} será conectado ao backend.`);

function ReviewDialog({ title, onClose, onConfirm }: { title: string; onClose(): void; onConfirm(schedule: boolean, date: string): void }) {
  const [schedule, setSchedule] = useState(true);
  const [interval, setInterval] = useState('7');
  const [customDate, setCustomDate] = useState('');
  const date = customDate || (() => { const value = new Date(); value.setDate(value.getDate() + Number(interval)); return value.toISOString().slice(0, 10); })();
  return <div className="sb-review-overlay" onMouseDown={onClose}><section className="sb-review-dialog" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true"><header><div><span>CONTEÚDO CONCLUÍDO</span><h2>Agendar revisão</h2><p>{title}</p></div><button onClick={onClose} aria-label="Fechar">×</button></header><div className="sb-review-body"><label className="sb-review-toggle"><input type="checkbox" checked={schedule} onChange={event => setSchedule(event.target.checked)} /><span><strong>Agendar revisão deste conteúdo</strong><small>Você poderá revisar o que acabou de estudar.</small></span></label>{schedule && <><label className="sb-review-field"><span>Intervalo padrão</span><select value={customDate ? 'custom' : interval} onChange={event => { const value = event.target.value; if (value === 'custom') setCustomDate(new Date().toISOString().slice(0, 10)); else { setCustomDate(''); setInterval(value); } }}><option value="1">Amanhã</option><option value="3">Em 3 dias</option><option value="7">Em 7 dias</option><option value="14">Em 14 dias</option><option value="30">Em 30 dias</option><option value="custom">Escolher uma data</option></select></label><label className="sb-review-field"><span>Data da revisão</span><input type="date" value={date} onChange={event => setCustomDate(event.target.value)} /></label></>}</div><footer><button onClick={onClose}>Cancelar</button><button className="filled-button" onClick={() => onConfirm(schedule, date)}>{schedule ? 'Concluir e agendar' : 'Concluir sem revisão'}</button></footer></section></div>;
}

type SubtopicRowProps = { child: SyllabusNodeResponse; onStartStudy(): void; onRemove(): void };
function SubtopicRow({ child, onStartStudy, onRemove }: SubtopicRowProps) {
  const [done, setDone] = useState(child.progress >= 100);
  const [revision, setRevision] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  return (
    <div className="sb-subtopic-row">
      <span className="sb-subtopic-arrow">↳</span>
      <span className={`sb-subtopic-name${done ? ' sb-done-text' : ''}`}>{child.title}</span>
      <div className="sb-subtopic-actions">
        <button data-pomodoro-trigger className="sb-subtopic-btn" title="Iniciar estudo" onClick={onStartStudy}>◷</button>
        <button className="sb-subtopic-btn" title="Materiais" onClick={() => unavail('Os materiais')}>▤</button>
        <button className={`sb-subtopic-btn${done ? ' sb-btn-done' : ''}`} title={done ? 'Marcar pendente' : 'Concluir'} onClick={() => { if (done) { setDone(false); setRevision(false); } else setReviewOpen(true); }}>{done ? '✓' : '○'}</button>
        <button className={`sb-subtopic-btn${revision ? ' sb-btn-revision' : ''}`} title={revision ? 'Desmarcar revisão' : 'Agendar revisão'} onClick={() => revision ? (setRevision(false), toast.success('Revisão desmarcada.')) : setReviewOpen(true)}>↻</button>
        <button className="sb-subtopic-btn sb-delete-btn" title="Apagar subtópico" onClick={onRemove}>
          <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
      </div>
      {reviewOpen && <ReviewDialog title={child.title} onClose={() => setReviewOpen(false)} onConfirm={(schedule, date) => { setDone(true); setRevision(schedule); setReviewOpen(false); toast.success(schedule ? `Revisão agendada para ${new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')}.` : 'Conteúdo concluído sem revisão.'); }} />}
    </div>
  );
}

type TopicRowProps = { topic: SyllabusNodeResponse; onAddSubtopic(): void; onStartStudy(subtopicId?: number): void; onRemove(): void; onRemoveSubtopic(id: number): void };
export function TopicRow({ topic, onAddSubtopic, onStartStudy, onRemove, onRemoveSubtopic }: TopicRowProps) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(topic.progress >= 100);
  const [revision, setRevision] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const progress = Math.round(topic.progress ?? 0);

  return (
    <div className={`sb-topic-card${open ? ' sb-open' : ''}${done ? ' sb-done' : ''}`}>
      <div className="sb-topic-header" role="button" tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => e.key === 'Enter' && setOpen(v => !v)}>
        <button className="sb-expand-btn" type="button" aria-label={open ? 'Recolher' : 'Expandir'} onClick={e => { e.stopPropagation(); setOpen(v => !v); }}>
          <i className="sb-chevron-icon">{open ? '∨' : '›'}</i>
        </button>
        <div className="sb-topic-text">
          <span className="sb-topic-name">{topic.title}</span>
          <span className="sb-topic-progress">
            {progress}% concluído
            {topic.children.length ? ` • ${topic.children.length} subtópico${topic.children.length > 1 ? 's' : ''}` : ''}
          </span>
        </div>
        <div className="sb-action-bar" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          <button data-pomodoro-trigger className="sb-action-btn" title="Iniciar estudo" onClick={() => onStartStudy()}>◷</button>
          <button className="sb-action-btn" title="Materiais" onClick={() => unavail('Os materiais')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button className={`sb-action-btn${done ? ' sb-btn-done' : ''}`} title={done ? 'Marcar como pendente' : 'Concluir tópico'} onClick={() => { if (done) { setDone(false); setRevision(false); } else setReviewOpen(true); }}>{done ? '✓' : '✓'}</button>
          <button className={`sb-revision-btn${revision ? ' sb-btn-revision' : ''}`} title={revision ? 'Desmarcar revisão' : 'Marcar revisão'} onClick={() => revision ? (setRevision(false), toast.success('Revisão desmarcada.')) : setReviewOpen(true)}>
            <svg viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 5l5 5L14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 9l5 5L21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={revision ? '1' : '0.35'}/>
            </svg>
          </button>
          <button className="sb-options-btn sb-delete-btn" title="Apagar tópico" onClick={onRemove}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="sb-topic-body">
          <div className="sb-questions-block">
            <div className="sb-questions-head">
              <span className="sb-questions-label">▤ QUESTÕES</span>
              <button className="sb-register-btn" onClick={() => unavail('O registro de questões')}>
                Registrar questões e horas de estudo
              </button>
            </div>
            <p className="sb-questions-empty">Nenhuma questão registrada ainda.</p>
          </div>
          {(topic.children.length > 0 || true) && (
            <div className="sb-subtopics-block">
              {topic.children.map(child => <SubtopicRow key={child.id} child={child} onStartStudy={() => onStartStudy(child.id)} onRemove={() => onRemoveSubtopic(child.id)} />)}
              <button className="sb-add-subtopic-btn" onClick={onAddSubtopic}>
                <span>＋</span> adicionar subtópico
              </button>
            </div>
          )}
        </div>
      )}
      {reviewOpen && <ReviewDialog title={topic.title} onClose={() => setReviewOpen(false)} onConfirm={(schedule, date) => { setDone(true); setRevision(schedule); setReviewOpen(false); toast.success(schedule ? `Revisão agendada para ${new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')}.` : 'Tópico concluído sem revisão.'); }} />}
    </div>
  );
}
