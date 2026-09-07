import { journeyStageLabel } from '../../../../@business/enum/EJourneyStage';
import type { JourneySummaryResponse } from '../../../../@business/dto/response/journey.response';
import { homeTokens } from './Home.tokens';

function formatDate(value?: string | null) {
  if (!value) return 'Não definida';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
function formatMinutes(value: number) { const h = Math.floor(value / 60); const m = value % 60; return h ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`; }
function progressOf(journey: JourneySummaryResponse) { return Math.min(100, Math.max(0, journey.progress)); }

function levelOf(journey: JourneySummaryResponse) {
  const index = homeTokens.journeyLevels.indexOf(journey.readinessLevel as typeof homeTokens.journeyLevels[number]);
  const currentIndex = index < 0 ? 0 : index;
  return { current: homeTokens.journeyLevels[currentIndex], next: homeTokens.journeyLevels[currentIndex + 1] };
}

type JourneyCardProps = { journey: JourneySummaryResponse; index: number; onOpen(): void; onEdit(): void; onRemove(): void };

export function JourneyCard({ journey, index, onOpen, onEdit, onRemove }: JourneyCardProps) {
  const progress = progressOf(journey);
  const accuracy = journey.questionsSolved
    ? Math.round(journey.correctAnswers / journey.questionsSolved * 1000) / 10
    : null;
  const level = levelOf(journey);
  const dailyAverage = journey.studyDays ? Math.round(journey.studiedMinutes / journey.studyDays) : 0;

  return <article className="journey-card home-journey-card" style={homeTokens.styles.cardAccent(homeTokens.cardAccents[index % homeTokens.cardAccents.length])} role="link" aria-label={`Abrir concurso ${journey.title}`} tabIndex={0} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}>
    <div className="journey-card-top"><span className="stage-pill">{journeyStageLabel[journey.stage]}</span><div className="card-actions"><button type="button" aria-label={`Editar ${journey.title}`} onClick={event => { event.stopPropagation(); onEdit(); }}>✎</button><button type="button" aria-label={`Remover ${journey.title}`} onClick={event => { event.stopPropagation(); onRemove(); }}><svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg></button></div></div>

    <div className="journey-cover">{journey.logoUrl ? <img src={journey.logoUrl} alt="" /> : <span>{journey.title.slice(0, 2).toUpperCase()}</span>}</div>

    <div className="journey-copy"><h3>{journey.title}</h3><p>{journey.institution || journey.position || 'Objetivo pessoal'}</p></div>

    <div className="card-metrics-inline">
      <div><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span>Acertos</span></div>
      <div><strong>{formatMinutes(journey.studiedMinutes)}</strong><span>Estudado</span></div>
      <div><strong>{journey.questionsSolved.toLocaleString('pt-BR')}</strong><span>Questões</span></div>
      <div><strong>{formatMinutes(dailyAverage)}</strong><span>Média/dia</span></div>
    </div>

    <div className="journey-progress"><div><span>{level.current}</span><strong>{progress}%</strong></div><span className="progress-track"><i style={homeTokens.styles.progress(progress)} /></span></div>

    <div className="journey-footer"><span className="journey-date">Prova: {formatDate(journey.examDate)}</span><span className="journey-arrow">→</span></div>
  </article>;
}

export function NewJourneyCard({ onClick }: { onClick(): void }) {
  return <button className="journey-add-card" type="button" onClick={onClick}><span className="add-orbit">＋</span><strong>Nova jornada</strong><small>Organize um concurso do seu jeito</small></button>;
}
