import { useState } from 'react';

type StudyProps = {
  mode?: 'study';
  title: string;
  defaultMinutes?: number;
  pending?: boolean;
  previousSummary?: string | null;
  onClose(): void;
  onConfirm(schedule: boolean, date: string, completedMinutes: number, completed: boolean, summary: string): void;
  onClearPending?(): void;
};

type RevisionProps = {
  mode: 'revision';
  title: string;
  previousSummary?: string | null;
  onClose(): void;
  onConfirm(scheduleNext: boolean, nextDate: string, summary: string): void;
};

type Props = StudyProps | RevisionProps;

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function DatePicker({ interval, setInterval, customDate, setCustomDate, date }: {
  interval: string; setInterval(v: string): void;
  customDate: string; setCustomDate(v: string): void;
  date: string;
}) {
  return (
    <>
      <label className="sb-review-field">
        <span>Intervalo</span>
        <select value={customDate ? 'custom' : interval} onChange={e => {
          const v = e.target.value;
          if (v === 'custom') setCustomDate(localDate(new Date()));
          else { setCustomDate(''); setInterval(v); }
        }}>
          <option value="1">Amanhã</option>
          <option value="2">Em 2 dias</option>
          <option value="3">Em 3 dias</option>
          <option value="7">Em 7 dias</option>
          <option value="14">Em 14 dias</option>
          <option value="30">Em 30 dias</option>
          <option value="custom">Escolher data</option>
        </select>
      </label>
      <label className="sb-review-field">
        <span>Data</span>
        <input type="date" value={date} onChange={e => setCustomDate(e.target.value)} />
      </label>
    </>
  );
}

export function ReviewDialog(props: Props) {
  const [completed, setCompleted] = useState(true);
  const [schedule, setSchedule] = useState(true);
  const [interval, setInterval] = useState(() =>
    props.mode === 'revision' ? '7' : String(Math.floor(Math.random() * 2) + 1)
  );
  const [customDate, setCustomDate] = useState('');
  const [completedMinutes, setCompletedMinutes] = useState(
    props.mode !== 'revision' ? (props.defaultMinutes ?? 60) : 0
  );
  const [summary, setSummary] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

  const date = customDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + Number(interval));
    return localDate(d);
  })();

  if (props.mode === 'revision') {
    return (
      <div className="sb-review-overlay" onMouseDown={props.onClose}>
        <section className="sb-review-dialog" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <header>
            <div>
              <span>REVISÃO CONCLUÍDA</span>
              <h2>Agendar próxima revisão</h2>
              <p>{props.title}</p>
            </div>
            <button onClick={props.onClose} aria-label="Fechar">×</button>
          </header>

          <div className="sb-review-body">
            {!summaryOpen ? (
              <button className="sb-summary-toggle-btn" type="button" onClick={() => setSummaryOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {props.previousSummary ? 'Editar resumo' : 'Adicionar resumo'}
              </button>
            ) : (
              <>
                {props.previousSummary && <div className="sb-review-previous"><strong>Resumo anterior</strong><p>{props.previousSummary}</p></div>}
                <label className="sb-review-field"><span>Novo resumo (opcional)</span><textarea rows={4} maxLength={10000} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Escreva com suas palavras o que você ainda lembra deste conteúdo." autoFocus/></label>
              </>
            )}
            <label className="sb-review-toggle">
              <input type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)} />
              <span>
                <strong>Agendar próxima revisão</strong>
                <small>Desmarque se não precisar revisar este conteúdo novamente.</small>
              </span>
            </label>
            {schedule && (
              <DatePicker
                interval={interval} setInterval={setInterval}
                customDate={customDate} setCustomDate={setCustomDate}
                date={date}
              />
            )}
          </div>

          <footer>
            <button onClick={props.onClose}>Cancelar</button>
            <button className="filled-button" onClick={() => props.onConfirm(schedule, date, summary)}>
              {schedule ? 'Revisar novamente' : 'Marcar como revisado'}
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="sb-review-overlay" onMouseDown={props.onClose}>
      <section className="sb-review-dialog" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <header>
          <div>
            <span>CONTEÚDO CONCLUÍDO</span>
            <h2>Registrar conclusão</h2>
            <p>{props.title}</p>
          </div>
          <button onClick={props.onClose} aria-label="Fechar">×</button>
        </header>

        <div className="sb-review-body">
          {!summaryOpen ? (
            <button className="sb-summary-toggle-btn" type="button" onClick={() => setSummaryOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {props.previousSummary ? 'Editar resumo' : 'Adicionar resumo'}
            </button>
          ) : (
            <>
              {props.previousSummary && <div className="sb-review-previous"><strong>Resumo anterior</strong><p>{props.previousSummary}</p></div>}
              <label className="sb-review-field"><span>Resumo do conteúdo (opcional)</span><textarea rows={4} maxLength={10000} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Registre com suas palavras os principais pontos estudados." autoFocus/></label>
            </>
          )}
          <label className="sb-review-field">
            <span>Tempo utilizado (minutos)</span>
            <input
              type="number"
              min="1"
              value={completedMinutes}
              onChange={e => setCompletedMinutes(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>

          <label className="sb-review-toggle">
            <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)} />
            <span>
              <strong>Marcar como concluído</strong>
              <small>Desmarque se ainda precisar continuar estudando este tópico.</small>
            </span>
          </label>

          {completed && (
            <label className="sb-review-toggle">
              <input type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)} />
              <span>
                <strong>Agendar revisão</strong>
                <small>Marque para lembrar de revisar este conteúdo depois.</small>
              </span>
            </label>
          )}

          {completed && schedule && (
            <DatePicker
              interval={interval} setInterval={setInterval}
              customDate={customDate} setCustomDate={setCustomDate}
              date={date}
            />
          )}
        </div>

        <footer>
          {props.pending && props.onClearPending && (
            <button className="sb-review-clear-pending" onClick={props.onClearPending}>Desmarcar pendência</button>
          )}
          <button onClick={props.onClose}>Cancelar</button>
          <button className="filled-button" onClick={() => props.onConfirm(completed && schedule, date, completedMinutes, completed, summary)}>
            {!completed ? 'Registrar tempo' : 'Concluir'}
          </button>
        </footer>
      </section>
    </div>
  );
}
