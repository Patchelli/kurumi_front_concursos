import { useState } from 'react';
import { toast } from 'sonner';
import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import type { JourneyViewProps } from './Journey.type';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { journeyTokens } from './Journey.tokens';
import { JourneySidebarAccountActions } from '@components/layout/JourneyProfileLink';
import { JourneyMobileMenu } from '@components/layout/JourneyMobileMenu';

type DisciplineSort = 'discipline' | 'study' | 'coverage' | 'accuracy';
type ErrorSort = 'discipline' | 'errors' | 'withReason' | 'coverage';

function fmtMin(v: number) {
  const h = Math.floor(v / 60), m = v % 60;
  return h ? `${h}h${m ? ` ${m}min` : ''}` : v ? `${m}min` : '0min';
}

function buildInsightsPrompt(journey: JourneyViewProps['journey'], overview: NonNullable<JourneyViewProps['overview']>) {
  if (!journey) return '';
  const { summary, readiness, days, weeks, areas, errors } = overview;
  const lines: string[] = [
    `Analise os dados de estudo abaixo de um aluno preparando-se para concurso e forneça insights, pontos fortes, pontos fracos e sugestões práticas de melhoria.\n`,
    `## Concurso: ${journey.title}`,
    `Cargo: ${journey.position || 'Não definido'}`,
    `Fase: ${journey.stage === EJourneyStage.Completed ? 'Concurso realizado' : journey.stage === EJourneyStage.PreNotice ? 'Pré-edital' : 'Pós-edital'}\n`,
    `## Resumo geral`,
    `- Tempo total de estudo: ${Math.floor(summary.studiedMinutes / 60)}h ${summary.studiedMinutes % 60}min`,
    `- Questões resolvidas: ${summary.questions} (${summary.correctAnswers} acertos)`,
    `- Acertos geral: ${summary.accuracy !== null ? summary.accuracy + '%' : 'sem dados'}`,
    `- Dias estudados: ${summary.studyDays}`,
    `- Sequência atual: ${summary.studyStreak} dias`,
    `- Tópicos concluídos: ${summary.completedTopics}/${summary.totalTopics}`,
    `- Subtópicos concluídos: ${summary.completedSubtopics}/${summary.totalSubtopics}`,
    `- Hoje: ${summary.todayMinutes}min, ${summary.todayQuestions} questões, ${summary.todaySessions} sessões\n`,
    `## Prontidão`,
    `- Score: ${readiness.score}/100 (${readiness.level})`,
    `- Cobertura: ${readiness.coverage}%`,
    `- Aplicação: ${readiness.application}%`,
    `- Retenção: ${readiness.retention}%`,
    `- Consistência: ${readiness.consistency}%\n`,
  ];
  if (days.length) {
    const WD = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    lines.push(`## Estudo por dia da semana`);
    days.forEach(d => lines.push(`- ${WD[d.dayOfWeek]}: ${d.studiedMinutes}min, ${d.questions} questões, acertos ${d.accuracy ?? '—'}%`));
    lines.push('');
  }
  if (weeks.length) {
    lines.push(`## Evolução semanal`);
    weeks.forEach(w => lines.push(`- ${w.label}: acertos ${w.accuracy ?? '—'}%, retenção ${w.retention ?? '—'}%`));
    lines.push('');
  }
  if (areas.length) {
    lines.push(`## Desempenho por matéria`);
    areas.forEach(a => {
      lines.push(`### ${a.title}`);
      lines.push(`  Tempo: ${Math.floor(a.studiedMinutes / 60)}h${a.studiedMinutes % 60}min | Cobertura: ${a.coverage}% | Questões: ${a.questions} | Acertos: ${a.accuracy ?? '—'}%`);
      lines.push(`  Erros: ${a.errors} (${a.errorsWithReason} classificados) | Erro predominante: ${a.predominantError || '—'} (${a.predominantErrorPercentage ?? 0}%)`);
      lines.push(`  Flashcards: ${a.flashcards} | Revisões: ${a.reviews} | Recall: ${a.recall ?? '—'}%`);
    });
    lines.push('');
  }
  if (errors.length) {
    lines.push(`## Motivos dos erros (geral)`);
    errors.forEach(e => lines.push(`- ${e.reason}: ${e.count} (${e.percentage}%)`));
    lines.push('');
  }
  lines.push(`Baseando-se nesses dados, me dê:\n1. Uma avaliação geral do meu progresso\n2. Meus pontos fortes\n3. Meus pontos fracos e riscos\n4. Sugestões práticas priorizadas para melhorar meu desempenho\n5. Em quais matérias devo focar mais`);
  return lines.join('\n');
}

function AccuracyRing({ pct, sub = 'de acertos' }: { pct: number | null; sub?: string }) {
  const r = 66, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (pct ?? 0) / 100);
  return (
    <div className="jd-ring-wrap">
      <svg viewBox="0 0 160 160">
        <circle className="jd-ring-bg" cx={cx} cy={cy} r={r} />
        {pct !== null && (
          <circle className="jd-ring-fill" cx={cx} cy={cy} r={r}
            strokeDasharray={circ} strokeDashoffset={offset} />
        )}
      </svg>
      <div className="jd-ring-center">
        <span className="jd-ring-pct">{pct !== null ? `${pct}%` : '—'}</span>
        <span className="jd-ring-sub">{sub}</span>
      </div>
    </div>
  );
}

function domainColor(pct: number | null) {
  if (pct === null) return '#c8c0d0';
  if (pct >= 70) return '#22907a';
  if (pct >= 40) return '#c87030';
  return '#b03055';
}
function domainDot(pct: number | null) {
  if (pct === null) return 'jd-dot-none';
  if (pct >= 70) return 'jd-dot-good';
  if (pct >= 40) return 'jd-dot-mid';
  return 'jd-dot-bad';
}

function CollapseButton({ label }: { label: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return <button className="jd-collapse-button" type="button" aria-label={`${collapsed ? 'Expandir' : 'Recolher'} ${label}`} aria-expanded={!collapsed} title={collapsed ? 'Expandir' : 'Recolher'} onClick={event => {
    event.stopPropagation();
    event.currentTarget.closest('.jd-card,.jd-ring-card,.jd-today-strip')?.classList.toggle('jd-collapsed');
    setCollapsed(value => !value);
  }}><svg className={collapsed ? 'collapsed' : ''} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></button>;
}

const WEEK_DAYS      = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const ERROR_COLORS = ['#b03055','#c87030','#4a70c8','#7c67a0','#22907a','#66558f','#8a6478'];

export function JourneyView(props: JourneyViewProps) {
  const { journey, overview, loading, onBack } = props;
  const [period, setPeriod] = useState<'7'|'14'|'30'|'all'>('all');
  const [accuracyPeriod, setAccuracyPeriod] = useState<'4'|'8'>('8');
  const [retentionPeriod, setRetentionPeriod] = useState<'4'|'8'>('8');
  const [disciplineSort, setDisciplineSort] = useState<{ key: DisciplineSort; direction: 'asc'|'desc' }>({ key: 'accuracy', direction: 'desc' });
  const [errorSort, setErrorSort] = useState<{ key: ErrorSort; direction: 'asc'|'desc' }>({ key: 'errors', direction: 'desc' });
  const [openArea, setOpenArea] = useState<number | null>(null);

  if (loading) return <StudyLoading label="Buscando os dados do concurso…" />;
  if (!journey || !overview) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  const stageLabel  = journey.stage === EJourneyStage.Completed ? 'Concurso realizado' : journey.stage === EJourneyStage.PreNotice ? 'Pré-edital' : 'Pós-edital';
  const today       = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  const { summary, readiness } = overview;
  const weekMinutes = WEEK_DAYS.map((_, day) => overview.days.find(item => item.dayOfWeek === day)?.studiedMinutes ?? 0);
  const weekAccuracy = WEEK_DAYS.map((_, day) => overview.days.find(item => item.dayOfWeek === day)?.accuracy ?? 0);
  const evolutionAccuracy = overview.weeks.map(item => item.accuracy);
  const retentionValues = overview.weeks.map(item => item.retention);
  const maxWeekMin = Math.max(...weekMinutes, 1);
  const avgDayMin = summary.studyDays ? Math.round(summary.studiedMinutes / summary.studyDays) : 0;
  const bestDay = weekMinutes.some(Boolean) ? WEEK_DAYS[weekMinutes.indexOf(Math.max(...weekMinutes))] : '—';
  const validEvolution = evolutionAccuracy.filter((value): value is number => value !== null);
  const evolDelta = validEvolution.length > 1 ? Math.round(((validEvolution.at(-1) ?? 0) - validEvolution[0]) * 10) / 10 : 0;
  const accuracyStart = accuracyPeriod === '4' ? 4 : 0;
  const retentionStart = retentionPeriod === '4' ? 4 : 0;

  /* mapa de perdas */
  const areaData = overview.areas.map(item => ({ area: journey.knowledgeAreas.find(area => area.id === item.id)!, ...item })).filter(item => item.area);
  const areasWithLoss = areaData.map(item => ({ area:item.area, lost:item.errors })).sort((a,b) => b.lost-a.lost);
  const flashcardData = areaData.map(item => ({ area:item.area, cards:item.flashcards, reviews:item.reviews, recall:item.recall ?? 0 }));
  const totalFlashcards = flashcardData.reduce((sum, item) => sum + item.cards, 0);
  const maxFlashcards = Math.max(1, ...flashcardData.map(item => item.cards));
  const maxFlashcardReviews = Math.max(1, ...flashcardData.map(item => item.reviews));
  const areasByAccuracy = areaData.filter(item => item.accuracy !== null).map(item => ({ area:item.area, accuracy:item.accuracy ?? 0 })).sort((a,b) => b.accuracy-a.accuracy);
  const rankingSize = areasByAccuracy.length < 2 ? areasByAccuracy.length : Math.min(3, Math.floor(areasByAccuracy.length / 2));
  const easiestAreas = areasByAccuracy.slice(0, rankingSize);
  const hardestAreas = [...areasByAccuracy].reverse().slice(0, rankingSize);
  const sortedDisciplineAreas = areaData.map(item => ({ area:item.area, study:item.studiedMinutes, coverage:item.coverage, accuracy:item.accuracy ?? 0 })).sort((a, b) => {
    const direction = disciplineSort.direction === 'asc' ? 1 : -1;
    if (disciplineSort.key === 'discipline') return a.area.title.localeCompare(b.area.title, 'pt-BR') * direction;
    return (a[disciplineSort.key] - b[disciplineSort.key]) * direction;
  });
  const changeDisciplineSort = (key: DisciplineSort) => setDisciplineSort(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  const sortIndicator = (key: DisciplineSort) => disciplineSort.key === key ? (disciplineSort.direction === 'desc' ? ' ↓' : ' ↑') : '';
  const sortedErrorAreas = areaData.map(item => ({ area:item.area, errors:item.errors, withReason:item.errorsWithReason, coverage:item.errors ? item.errorsWithReason * 100 / item.errors : 0, predominant:item.predominantError ?? 'Não especificado', predominantPercentage:item.predominantErrorPercentage ?? (item.errorsWithReason && item.predominantErrorCount ? Math.round(item.predominantErrorCount * 1000 / item.errorsWithReason) / 10 : null) })).sort((a, b) => {
    const direction = errorSort.direction === 'asc' ? 1 : -1;
    if (errorSort.key === 'discipline') return a.area.title.localeCompare(b.area.title, 'pt-BR') * direction;
    return (a[errorSort.key] - b[errorSort.key]) * direction;
  });
  const changeErrorSort = (key: ErrorSort) => setErrorSort(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  const errorSortIndicator = (key: ErrorSort) => errorSort.key === key ? (errorSort.direction === 'desc' ? ' ↓' : ' ↑') : '';

  return (
    <div className="jd-shell">
      <JourneyMobileMenu active="overview" onStudyPlan={props.onOpenStudyPlan} onSimulados={props.onOpenSimulados} onCapsule={props.onOpenCapsule} onContent={props.onOpenContent} onBack={onBack} />

      {/* ── Sidebar ── */}
      <aside className="jd-sidebar">
        <div className="jd-brand"><span>K</span><strong>Kurumí</strong></div>
        <nav className="jd-nav">
          <button className="active">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Visão geral</span>
          </button>
          <button onClick={props.onOpenStudyPlan}>
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span>Plano de estudos</span>
          </button>
          <button onClick={props.onOpenSimulados}>
            <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Simulados</span>
          </button>
          <button onClick={props.onOpenCapsule}>
            <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6"/></svg>
            <span>Cápsula</span>
          </button>
          <button onClick={props.onOpenContent}>
            <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            <span>Conteúdo</span>
          </button>
        </nav>
        <JourneySidebarAccountActions />
        <div className="jd-contest-card">
          <div className="jd-thumb">
            {journey.logoUrl ? <img src={journey.logoUrl} alt="" /> : journey.title.slice(0,2).toUpperCase()}
          </div>
          <div><strong>{journey.title}</strong><small>{journey.institution || stageLabel}</small></div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="jd-main">

        {/* Topbar */}
        <div className="jd-topbar">
          <div className="jd-topbar-left">
            <span className="jd-page-context">VISÃO GERAL</span>
            <h1>{journey.title}</h1>
            <p>{journey.position || 'Cargo não definido'} <span>•</span> {stageLabel}</p>
          </div>
          <div className="jd-topbar-right">
            <div className="jd-period-filters">
              {(['7','14','30','all'] as const).map(p => (
                <button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>
                  {p==='all'?'Tudo':`${p}d`}
                </button>
              ))}
            </div>
            <button className="jd-ai-btn" onClick={() => { navigator.clipboard.writeText(buildInsightsPrompt(journey, overview)); toast.success('Prompt copiado! Cole na sua IA favorita.'); }}>
              <svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3v-8a3 3 0 013-3h1V6a4 4 0 014-4zm0 2a2 2 0 00-2 2v1h4V6a2 2 0 00-2-2zm-3 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z"/></svg>
              Insights IA
            </button>
            <button className="jd-back-link" onClick={onBack}>
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Jornadas
            </button>
          </div>
        </div>

        {/* ── Stats strip: acumulado ── */}
        <div className="jd-stats-strip">
          <div className="jd-stat jd-stat--p">
            <strong>{fmtMin(summary.studiedMinutes)}</strong>
            <small>Horas totais</small>
          </div>
          <div className="jd-stat jd-stat--t">
            <strong>{summary.questions.toLocaleString('pt-BR')}</strong>
            <small>Questões resolvidas</small>
          </div>
          <div className="jd-stat jd-stat--a">
            <strong>{summary.accuracy === null ? '—' : `${summary.accuracy}%`}</strong>
            <small>Acertos no geral</small>
          </div>
          <div className="jd-stat jd-stat--r">
            <strong>{summary.studyDays}</strong>
            <small>Dias estudados</small>
          </div>
          <div className="jd-stat jd-stat--g">
            <strong>{summary.completedTopics}<span>/{summary.totalTopics}</span></strong>
            <small>Tópicos concluídos</small>
            <em>{summary.completedSubtopics}/{summary.totalSubtopics} subtópicos</em>
          </div>
        </div>

        {/* ── Hoje — faixa compacta ── */}
        <div className="jd-today-strip">
          <span className="jd-today-strip-eyebrow">HOJE · <span style={journeyTokens.styles.today}>{today}</span></span>
          <CollapseButton label="resumo de hoje" />
          <div className="jd-today-strip-stats">
            <div className="jd-today-strip-stat">
              <strong>{fmtMin(summary.todayMinutes)}</strong><small>Horas</small>
            </div>
            <div className="jd-today-strip-stat">
              <strong>{summary.todayQuestions}</strong><small>Questões</small>
            </div>
            <div className="jd-today-strip-stat">
              <strong>{summary.todayAccuracy === null ? '—' : `${summary.todayAccuracy}%`}</strong><small>Acertos</small>
            </div>
            <div className="jd-today-strip-stat">
              <strong>{summary.todaySessions}</strong><small>Sessões</small>
            </div>
            <div className="jd-today-strip-streak">🔥 {summary.studyStreak} {summary.studyStreak === 1 ? 'dia seguido' : 'dias seguidos'}</div>
          </div>
        </div>

        {/* ── Centro: Prontidão (anel) + Tempo por dia da semana (gráfico) ── */}
        <div className="jd-center">

          {/* Prontidão para prova */}
          {(() => {
            const components  = [
              { label: 'Cobertura', val: readiness.coverage, tip: 'Percentual de todo o edital que já foi estudado' },
              { label: 'Aplicação', val: readiness.application, tip: 'Se o conteúdo estudado está sendo aplicado corretamente nas questões' },
              { label: 'Retenção', val: readiness.retention, tip: 'Percentual de cards lembrados nas revisões' },
              { label: 'Consistência', val: readiness.consistency, tip: 'Regularidade dos estudos ao longo do tempo' },
            ];
            return (
              <div className="jd-ring-card">
                <h3>Situação da preparação</h3><CollapseButton label="situação da preparação" />
                <AccuracyRing pct={readiness.score} sub={readiness.level} />
                <div className="jd-ring-stats">
                  {components.map(c => (
                    <div className="jd-ring-stat" key={c.label} title={c.tip}>
                      <span className="jd-ring-stat-left">
                        <span className={`jd-domain-dot ${domainDot(c.val)}`} style={journeyTokens.styles.inlineDot}/>
                        {c.label}
                      </span>
                      <div className="jd-readiness-bar-wrap">
                        <div className="jd-readiness-bar" style={journeyTokens.styles.widthColor(c.val, domainColor(c.val))}/>
                      </div>
                      <span className="jd-ring-stat-val">{c.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Tempo por dia da semana */}
          <div className="jd-card">
            <div className="jd-card-header">
              <h3>Tempo por dia da semana</h3>
              <small>Média histórica por dia</small>
              <CollapseButton label="tempo por dia da semana" />
            </div>
            <div className="jd-time-stats">
              <div className="jd-time-stat">
                <strong>{fmtMin(avgDayMin)}</strong>
                <span>Tempo médio/dia</span>
              </div>
              <div className="jd-time-stat">
                <strong>{bestDay}</strong>
                <span>Dia mais produtivo</span>
              </div>
            </div>
            <div className="jd-weekday-chart">
              {WEEK_DAYS.map((day, i) => {
                const min    = weekMinutes[i];
                const acc    = weekAccuracy[i];
                const height = Math.round(min / maxWeekMin * 100);
                const isBest = min > 0 && min === Math.max(...weekMinutes);
                return (
                  <div className="jd-wday-col" key={day}>
                    <div className="jd-wday-bars">
                      <div className="jd-wday-bar acc" style={journeyTokens.styles.height(acc)} title={`Acertos: ${acc}%`}/>
                      <div className={`jd-wday-bar time${isBest?' best':''}`} style={journeyTokens.styles.height(height)} title={fmtMin(min)}/>
                    </div>
                    <span className="jd-wday-time">{fmtMin(min)}</span>
                    <span className="jd-wday-label">{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="jd-weekday-legend">
              <span><i style={journeyTokens.styles.legendTime}/> Tempo</span>
              <span><i style={journeyTokens.styles.legendPerformance}/> Desempenho</span>
            </div>
          </div>
        </div>

        {/* ── Evolução dos acertos + Eficiência ── */}
        <div className="jd-insights-row">

          {/* Evolução dos acertos */}
          <div className="jd-card">
            <div className="jd-card-header">
              <h3>Evolução dos acertos</h3>
              <div className="jd-chart-header-actions"><small style={journeyTokens.styles.colorStrong(evolDelta >= 0 ? journeyTokens.colors.success : journeyTokens.colors.danger)}>{evolDelta >= 0 ? '▲' : '▼'} {Math.abs(evolDelta)}pp</small><div className="jd-chart-period"><button className={accuracyPeriod === '4' ? 'active' : ''} onClick={() => setAccuracyPeriod('4')}>4 sem</button><button className={accuracyPeriod === '8' ? 'active' : ''} onClick={() => setAccuracyPeriod('8')}>8 sem</button></div><CollapseButton label="evolução dos acertos" /></div>
            </div>
            <div className="jd-evol-chart">
              {overview.weeks.slice(accuracyStart).map((item, visibleIndex) => {
                const i = visibleIndex + accuracyStart;
                const acc    = evolutionAccuracy[i];
                const height = acc ?? 0;
                const color  = domainColor(acc);
                return (
                  <div className="jd-evol-col" key={item.label}>
                    <span className="jd-evol-val" style={journeyTokens.styles.color(color)}>{acc === null ? '—' : `${acc}%`}</span>
                    <div className="jd-evol-bar-track">
                      <div className="jd-evol-bar" style={journeyTokens.styles.heightColor(height, color)}/>
                    </div>
                    <span className="jd-evol-label">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="jd-evol-tip">
              {(validEvolution.at(-1) ?? 0) >= 70
                ? 'Boa evolução! Você está acima de 70% — continue revisando para manter.'
                : 'Ainda em crescimento. Foque nas disciplinas com menor domínio.'}
            </p>
          </div>

          <div className="jd-card jd-retention-card">
            <div className="jd-card-header">
              <h3>Evolução da retenção</h3>
              <div className="jd-chart-header-actions"><small>% de cards lembrados</small><div className="jd-chart-period"><button className={retentionPeriod === '4' ? 'active' : ''} onClick={() => setRetentionPeriod('4')}>4 sem</button><button className={retentionPeriod === '8' ? 'active' : ''} onClick={() => setRetentionPeriod('8')}>8 sem</button></div><CollapseButton label="evolução da retenção" /></div>
            </div>
            <div className="jd-evol-chart">
              {overview.weeks.slice(retentionStart).map((item, visibleIndex) => {
                const i = visibleIndex + retentionStart;
                const retention = retentionValues[i];
                const height = retention ?? 0;
                return <div className="jd-evol-col" key={item.label}>
                  <span className="jd-evol-val jd-retention-val">{retention === null ? '—' : `${retention}%`}</span>
                  <div className="jd-evol-bar-track"><div className="jd-evol-bar jd-retention-bar" style={journeyTokens.styles.height(height)} /></div>
                  <span className="jd-evol-label">{item.label}</span>
                </div>;
              })}
            </div>
            <p className="jd-evol-tip jd-retention-tip">A retenção indica quanto do conteúdo estudado continua disponível na memória durante as revisões.</p>
          </div>

        </div>

        <section className="jd-flashcards-section" aria-labelledby="flashcards-insights-title">
          <div className="jd-flashcards-heading"><div><span className="eyebrow">FLASHCARDS</span><h2 id="flashcards-insights-title">Memória e revisões</h2></div><div className="jd-flashcards-total"><strong>{totalFlashcards.toLocaleString('pt-BR')}</strong><span>cards no total</span></div></div>
          <div className="jd-flashcards-grid">
            <div className="jd-card">
              <div className="jd-card-header"><h3>Cards por disciplina</h3><small>Quantidade criada</small><CollapseButton label="cards por disciplina" /></div>
              <div className="jd-flashcard-list">{flashcardData.map(({ area, cards }) => <div className="jd-flashcard-row" key={area.id}><div><span title={area.title}>{area.title}</span><strong>{cards}</strong></div><div className="jd-ebar-track"><div className="jd-ebar flashcards" style={journeyTokens.styles.width(Math.round(cards / maxFlashcards * 100))} /></div></div>)}</div>
            </div>
            <div className="jd-card">
              <div className="jd-card-header"><h3>Mais revisados</h3><small>Revisões por disciplina</small><CollapseButton label="cards mais revisados" /></div>
              <div className="jd-flashcard-list">{[...flashcardData].sort((a,b) => b.reviews-a.reviews).map(({ area, reviews }) => <div className="jd-flashcard-row" key={area.id}><div><span title={area.title}>{area.title}</span><strong>{reviews}</strong></div><div className="jd-ebar-track"><div className="jd-ebar reviews" style={journeyTokens.styles.width(Math.round(reviews / maxFlashcardReviews * 100))} /></div></div>)}</div>
            </div>
            <div className="jd-card">
              <div className="jd-card-header"><h3>Acertos dos flashcards</h3><small>Percentual lembrado por disciplina</small><CollapseButton label="acertos dos flashcards" /></div>
              <div className="jd-flashcard-list">{[...flashcardData].sort((a,b) => b.recall-a.recall).map(({ area, recall }) => <div className="jd-flashcard-row" key={area.id}><div><span title={area.title}>{area.title}</span><strong>{recall}%</strong></div><div className="jd-flashcard-split"><i className="remembered" style={journeyTokens.styles.width(recall)} /></div></div>)}</div>
            </div>
          </div>
        </section>

        {/* ── Taxa de acertos por disciplina + Questões por disciplina ── */}
        <div className="jd-insights-row" style={journeyTokens.styles.spacedInsights}>

          {/* Taxa de acertos por disciplina */}
          <div className="jd-card jd-discipline-overview-card">
            <div className="jd-subject-card-header" style={journeyTokens.styles.subjectHeader}>
              <div>
                <h3 style={journeyTokens.styles.subjectTitle}>Tempo, cobertura e acertos por disciplina</h3>
                <small style={journeyTokens.styles.subjectSubtitle}>Horas estudadas, conteúdo percorrido e desempenho nas questões</small>
              </div>
              <CollapseButton label="tempo e acertos por disciplina" />
            </div>
            {journey.knowledgeAreas.length
              ? <div className="jd-effort-list jd-discipline-metrics" style={journeyTokens.styles.effortList}>
                  <div className="jd-discipline-columns"><button type="button" onClick={() => changeDisciplineSort('discipline')}>Disciplina{sortIndicator('discipline')}</button><button type="button" onClick={() => changeDisciplineSort('study')}>Estudo{sortIndicator('study')}</button><button type="button" onClick={() => changeDisciplineSort('coverage')}>Cobertura{sortIndicator('coverage')}</button><button type="button" onClick={() => changeDisciplineSort('accuracy')}>Acertos{sortIndicator('accuracy')}</button></div>
                  {sortedDisciplineAreas.map(({ area, study, coverage, accuracy: acc }) => {
                    return (
                      <div className="jd-discipline-metric-row" key={area.id}>
                        <span className="jd-effort-name" title={area.title}>{area.title}</span>
                        <span className="jd-effort-hours">{fmtMin(study)}</span>
                        <span className="jd-effort-coverage">{coverage}%</span>
                        <span className="jd-effort-acc" style={journeyTokens.styles.colorStrong(domainColor(acc))}>{acc}%</span>
                        <div className="jd-effort-bars jd-discipline-bars">
                          <div className="jd-ebar-track">
                            <div className="jd-ebar" style={journeyTokens.styles.widthColor(acc, domainColor(acc))}/>
                          </div>
                          <div className="jd-ebar-track" title={`Cobertura da disciplina: ${coverage}%`}>
                            <div className="jd-ebar coverage" style={journeyTokens.styles.width(coverage)}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              : <div className="jd-subject-empty"><span>▤</span><p>Adicione disciplinas para ver a taxa de acertos.</p></div>
            }
          </div>

          {/* Questões por disciplina */}
          <div className="jd-card">
            <div className="jd-card-header">
              <h3>Questões por disciplina</h3>
              <small>{summary.questions.toLocaleString('pt-BR')} total</small>
              <CollapseButton label="questões por disciplina" />
            </div>
            <div className="jd-effort-list">
              {areaData
                .map(item => ({ area:item.area, q:item.questions }))
                .sort((a,b) => b.q - a.q)
                .map(({area, q}) => {
                  const pct = summary.questions ? Math.round(q / summary.questions * 100) : 0;
                  return (
                    <div className="jd-effort-row" key={area.id}>
                      <span className="jd-effort-name" title={area.title}>{area.title}</span>
                      <div className="jd-effort-meta">
                        <span className="jd-effort-hours">{q}q</span>
                        <span className="jd-effort-dot"/>
                        <span className="jd-effort-acc">{pct}%</span>
                      </div>
                      <div className="jd-effort-bars">
                        <div className="jd-ebar-track"><div className="jd-ebar acc" style={journeyTokens.styles.width(pct)}/></div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        <div className="jd-card jd-difficulty-card">
          <div className="jd-card-header"><div><h3>Facilidade e dificuldade por disciplina</h3><small>Comparação baseada no percentual de acertos</small></div><CollapseButton label="facilidade e dificuldade por disciplina" /></div>
          <div className="jd-difficulty-grid">
            <section><header><span className="jd-difficulty-icon easy">↑</span><div><strong>Maior facilidade</strong><small>Melhor desempenho</small></div></header><div className="jd-difficulty-list">{easiestAreas.map(({ area, accuracy }) => <div className="jd-difficulty-row" key={area.id}><div><span title={area.title}>{area.title}</span><strong>{accuracy}%</strong></div><div className="jd-difficulty-track"><i className="easy" style={journeyTokens.styles.width(accuracy)} /></div></div>)}</div></section>
            <section><header><span className="jd-difficulty-icon hard">!</span><div><strong>Maior dificuldade</strong><small>Precisa de mais atenção</small></div></header><div className="jd-difficulty-list">{hardestAreas.map(({ area, accuracy }) => <div className="jd-difficulty-row" key={area.id}><div><span title={area.title}>{area.title}</span><strong>{accuracy}%</strong></div><div className="jd-difficulty-track"><i className="hard" style={journeyTokens.styles.width(100-accuracy)} /></div></div>)}</div></section>
          </div>
        </div>

        {/* ── Análise de erros ── */}
        <div className="jd-errors-grid">
          <div className="jd-card jd-error-types-card">
            <div className="jd-card-header"><h3>Tipos de erro</h3><small>Distribuição geral</small><CollapseButton label="tipos de erro" /></div>
            <div className="jd-error-types">
              {overview.errors.map((item,index) => (
                <div className="jd-error-type-row" key={item.reason}>
                  <span className="jd-error-type-label">{item.reason}</span>
                  <div className="jd-ebar-track"><div className="jd-ebar" style={journeyTokens.styles.widthColor(item.percentage, ERROR_COLORS[index % ERROR_COLORS.length])}/></div>
                  <span className="jd-error-type-pct" style={journeyTokens.styles.color(ERROR_COLORS[index % ERROR_COLORS.length])}>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="jd-card jd-error-table-card">
            <div className="jd-card-header"><h3>Erros por disciplina</h3><small>Cobertura e motivo predominante</small><CollapseButton label="erros por disciplina" /></div>
            <div className="jd-error-table-wrap">
              <table className="jd-error-table">
                <thead>
                  <tr>
                    <th><button type="button" onClick={() => changeErrorSort('discipline')}>Disciplina{errorSortIndicator('discipline')}</button></th>
                    <th><button type="button" onClick={() => changeErrorSort('errors')}>Erros{errorSortIndicator('errors')}</button></th>
                    <th><button type="button" onClick={() => changeErrorSort('withReason')}>Com motivo{errorSortIndicator('withReason')}</button></th>
                    <th><button type="button" onClick={() => changeErrorSort('coverage')}>Cobertura{errorSortIndicator('coverage')}</button></th>
                    <th>Motivo predominante</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedErrorAreas.map(({ area, errors, withReason, coverage, predominant, predominantPercentage }) => {
                    return (
                      <tr key={area.id}>
                        <td className="jd-err-name">{area.title}</td>
                        <td className="jd-err-num">{errors}</td>
                        <td className="jd-err-num">{withReason}</td>
                        <td className="jd-err-num">{coverage.toFixed(1).replace('.',',')}%</td>
                        <td className="jd-err-pred">{predominant} {predominantPercentage != null && <span>{predominantPercentage}%</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Mapa de domínio do edital ── */}
        <div className="jd-card jd-edital-card">
          <div className="jd-card-header">
            <h3>Mapa de domínio do edital</h3>
            <div className="jd-domain-legend">
              <span className="jd-dl jd-dot-good">≥70%</span>
              <span className="jd-dl jd-dot-mid">40–69%</span>
              <span className="jd-dl jd-dot-bad">&lt;40%</span>
            </div>
            <CollapseButton label="mapa de domínio do edital" />
          </div>
          {journey.knowledgeAreas.length
            ? <div className="jd-edital-areas">
                {journey.knowledgeAreas.map((area, ai) => {
                  const isOpen    = openArea === area.id;
                  const overviewArea = overview.areas.find(item => item.id === area.id);
                  const areaDomain = overviewArea?.coverage ?? null;
                  return (
                    <div className="jd-edital-area" key={area.id}>
                      <button className="jd-edital-area-header" onClick={() => setOpenArea(isOpen ? null : area.id)}>
                        <span className={`jd-domain-dot ${domainDot(areaDomain)}`} />
                        <span className="jd-edital-area-name">{area.title}</span>
                        <span className="jd-edital-area-count">{area.nodes.length}t</span>
                        <span className="jd-edital-area-score" style={journeyTokens.styles.color(domainColor(areaDomain))}>{areaDomain === null ? '—' : `${areaDomain}%`}</span>
                        <svg className={`jd-chevron${isOpen?' open':''}`} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      {isOpen && (
                        <div className="jd-edital-topics">
                          {area.nodes.length
                            ? area.nodes.map(node => {
                                const score = overviewArea?.topics.find(item => item.id === node.id)?.coverage ?? null;
                                return (
                                  <div className="jd-edital-topic" key={node.id}>
                                    <span className={`jd-domain-dot small ${domainDot(score)}`} />
                                    <span className="jd-edital-topic-name">{node.title}</span>
                                    <span className="jd-edital-topic-score" style={journeyTokens.styles.color(domainColor(score))}>{score === null ? '—' : `${score}%`}</span>
                                  </div>
                                );
                              })
                            : <p className="jd-empty-hint" style={journeyTokens.styles.emptyTopics}>Nenhum tópico cadastrado.</p>
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            : <p className="jd-empty-hint">Importe o edital para ver o mapa de domínio por tópico.</p>
          }
        </div>

        {/* ── Onde estou perdendo pontos (largura total) ── */}
        <div className="jd-losses-full">
          <div className="jd-card jd-losses-card">
            <div className="jd-card-header">
              <h3>Onde estou perdendo pontos</h3>
              <small>Por questões erradas por disciplina</small>
              <CollapseButton label="onde estou perdendo pontos" />
            </div>
            {areasWithLoss.length
              ? <div className="jd-losses-list">
                  {areasWithLoss.map(({ area, lost }, rank) => (
                    <div className="jd-loss-row" key={area.id}>
                      <span className="jd-loss-rank">#{rank+1}</span>
                      <span className="jd-loss-name" title={area.title}>{area.title}</span>
                      <span className="jd-loss-val">−{lost}</span>
                    </div>
                  ))}
                </div>
              : <p className="jd-empty-hint">Resolva questões por disciplina para ver onde focar.</p>
            }
          </div>
        </div>

      </main>

      <ContestFAB journeyId={journey.id} areas={journey.knowledgeAreas} />

    </div>
  );
}
