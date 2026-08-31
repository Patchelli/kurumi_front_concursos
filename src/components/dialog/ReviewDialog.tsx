import { useState } from 'react';

type StudyProps = {
  mode?: 'study';
  title: string;
  defaultMinutes?: number;
  pending?: boolean;
  onClose(): void;
  onConfirm(schedule: boolean, date: string, completedMinutes: number, completed: boolean): void;
  onClearPending?(): void;
};

type RevisionProps = {
  mode: 'revision';
  title: string;
  onClose(): void;
  onConfirm(scheduleNext: boolean, nextDate: string): void;
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
  const [interval, setInterval] = useState('7');
  const [customDate, setCustomDate] = useState('');
  const [completedMinutes, setCompletedMinutes] = useState(
    props.mode !== 'revision' ? (props.defaultMinutes ?? 60) : 0
  );

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
            <button className="filled-button" onClick={() => props.onConfirm(schedule, date)}>
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
          <button className="filled-button" onClick={() => props.onConfirm(completed && schedule, date, completedMinutes, completed)}>
            {!completed ? 'Registrar tempo' : 'Concluir'}
          </button>
        </footer>
      </section>
    </div>
  );
}
