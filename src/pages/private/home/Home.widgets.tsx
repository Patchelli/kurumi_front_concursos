import { journeyStageLabel } from '../../../../@business/enum/EJourneyStage';
import type { JourneySummaryResponse } from '../../../../@business/dto/response/journey.response';
import { homeTokens } from './Home.tokens';

function formatDate(value?: string | null) {
  if (!value) return 'Data não definida';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
function formatMinutes(value: number) { const h = Math.floor(value / 60); const m = value % 60; return h ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`; }
function progressOf(journey: JourneySummaryResponse) { return Math.min(100, Math.max(0, journey.progress ?? journey.knowledgeAreas * 7)); }

const journeyLevels = ['Aspirante', 'Preparado', 'Competitivo', 'Avançado', 'Elite', 'Aprovação'] as const;

function levelOf(progress: number) {
  const index = progress >= 100 ? journeyLevels.length - 1 : Math.min(Math.floor(progress / 20), journeyLevels.length - 2);
  return { current: journeyLevels[index], next: journeyLevels[index + 1] };
}

type JourneyCardProps = { journey: JourneySummaryResponse; index: number; onOpen(): void; onEdit(): void; onRemove(): void };

export function JourneyCard({ journey, index, onOpen, onEdit, onRemove }: JourneyCardProps) {
  const progress = progressOf(journey);
  const accuracy = journey.questionsSolved ? Math.round((journey.correctAnswers ?? 0) / journey.questionsSolved * 100) : null;
  const level = levelOf(progress);
  const dailyAverage = journey.studyDays ? Math.round((journey.studiedMinutes ?? 0) / journey.studyDays) : 0;
  return <article className="journey-card home-journey-card" style={homeTokens.styles.cardAccent(homeTokens.cardAccents[index % homeTokens.cardAccents.length])} role="link" aria-label={`Abrir concurso ${journey.title}`} tabIndex={0} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}>
    <div className="journey-card-top"><span className="stage-pill">{journeyStageLabel[journey.stage]}</span><div className="card-actions"><button type="button" aria-label={`Editar ${journey.title}`} onClick={event => { event.stopPropagation(); onEdit(); }}>✎</button><button type="button" aria-label={`Remover ${journey.title}`} onClick={event => { event.stopPropagation(); onRemove(); }}><svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg></button></div></div>
    <div className="journey-cover">{journey.logoUrl ? <img src={journey.logoUrl} alt="" /> : <span>{journey.title.slice(0, 2).toUpperCase()}</span>}<div className="level-badge"><small>NÍVEL</small><strong>{level.current}</strong></div></div>
    <div className="journey-copy"><span>{journey.institution || 'Objetivo pessoal'}</span><h3>{journey.title}</h3><p>{journey.position || 'Cargo não definido'}</p></div>
    <div className="card-performance"><div className="metric-performance"><small>Seu desempenho</small><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span aria-hidden="true">☆</span></div><div className="metric-hours"><small>Horas estudadas</small><strong>{formatMinutes(journey.studiedMinutes ?? 0)}</strong><span aria-hidden="true">◷</span></div><div className="metric-questions"><small>Questões resolvidas</small><strong>{(journey.questionsSolved ?? 0).toLocaleString('pt-BR')}</strong><span aria-hidden="true">✓</span></div><div className="metric-average"><small>Média de horas diárias</small><strong>{formatMinutes(dailyAverage)}</strong><span aria-hidden="true">⌛</span></div></div>
    <div className="journey-progress"><div><span>Nível {level.current}</span><strong>{progress}%</strong></div><span className="progress-track"><i style={homeTokens.styles.progress(progress)} /></span><small>{level.next ? `Próximo nível: ${level.next}` : 'Nível máximo alcançado'}</small></div>
    <div className="journey-meta"><div><span>PROVA</span><strong>{formatDate(journey.examDate)}</strong></div><div><span>STATUS</span><strong>{journeyStageLabel[journey.stage]}</strong></div></div>
    <button className="open-journey" type="button" onClick={event => { event.stopPropagation(); onOpen(); }}>Abrir concurso <span>→</span></button>
  </article>;
}

export function NewJourneyCard({ onClick }: { onClick(): void }) {
  return <button className="journey-add-card" type="button" onClick={onClick}><span className="add-orbit">＋</span><strong>Criar nova jornada</strong><small>Organize um concurso do seu jeito</small></button>;
}
