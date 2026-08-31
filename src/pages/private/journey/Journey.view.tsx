import { useState } from 'react';
import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import type { JourneyViewProps } from './Journey.type';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { journeyTokens } from './Journey.tokens';
import { JourneyProfileLink } from '@components/layout/JourneyProfileLink';
import { JourneyMobileMenu } from '@components/layout/JourneyMobileMenu';

type DisciplineSort = 'discipline' | 'study' | 'coverage' | 'accuracy';
type ErrorSort = 'discipline' | 'errors' | 'withReason' | 'coverage';

function fmtMin(v: number) {
  const h = Math.floor(v / 60), m = v % 60;
  return h ? `${h}h${m ? ` ${m}min` : ''}` : v ? `${m}min` : '0min';
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
const MOCK_WEEK_MIN = journeyTokens.mock.weekMinutes;
const MOCK_WEEK_ACC = journeyTokens.mock.weekAccuracy;
const MOCK_EVOL_WEEKS = ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'];
const MOCK_EVOL_ACC = journeyTokens.mock.evolutionAccuracy;
const MOCK_RETENTION_WEEKS = journeyTokens.mock.retentionWeeks;
const MOCK_RETENTION = journeyTokens.mock.retentionPercentages;
const MOCK_AREA_ACC = journeyTokens.mock.areaAccuracy;
const MOCK_AREA_HRS = journeyTokens.mock.areaHours;
const MOCK_AREA_Q = journeyTokens.mock.areaQuestions;
const MOCK_AREA_ERR = journeyTokens.mock.areaErrors;
const MOCK_AREA_COVERAGE = journeyTokens.mock.areaCoverage;
const MOCK_FLASHCARDS = journeyTokens.mock.flashcardsByArea;
const MOCK_FLASHCARD_REVIEWS = journeyTokens.mock.flashcardReviewsByArea;
const MOCK_FLASHCARD_RECALL = journeyTokens.mock.flashcardRecallByArea;
const MOCK_TOPIC_DLT = journeyTokens.mock.topicDelta;
const MOCK_PRED_ERR  = ['Confusão conceitual','Desatenção','Falta de base','Confusão conceitual','Interpretação','Desatenção','Falta de base','Confusão conceitual','Desatenção','Falta de base','Interpretação','Confusão conceitual'];
const MOCK_PRED_PCT = journeyTokens.mock.predictedPercentages;
const MOCK_ERR_TYPES = [
  { label: 'Confusão conceitual', pct: 38, color: '#b03055' },
  { label: 'Desatenção',          pct: 24, color: '#c87030' },
  { label: 'Interpretação errada',pct: 21, color: '#4a70c8' },
  { label: 'Falta de base',       pct: 12, color: '#7c67a0' },
  { label: 'Pegadinha de prova',  pct:  5, color: '#22907a' },
];
function mockAcc(i: number)  { return MOCK_AREA_ACC[i % MOCK_AREA_ACC.length]; }
function mockMin(i: number)  { return MOCK_AREA_HRS[i % MOCK_AREA_HRS.length] * 60; }
function mockQ(i: number)    { return MOCK_AREA_Q[i % MOCK_AREA_Q.length]; }
function mockErr(i: number)  { return MOCK_AREA_ERR[i % MOCK_AREA_ERR.length]; }
function mockCoverage(i: number) { return MOCK_AREA_COVERAGE[i % MOCK_AREA_COVERAGE.length]; }
function mockFlashcards(i: number) { return MOCK_FLASHCARDS[i % MOCK_FLASHCARDS.length]; }
function mockFlashcardReviews(i: number) { return MOCK_FLASHCARD_REVIEWS[i % MOCK_FLASHCARD_REVIEWS.length]; }
function mockFlashcardRecall(i: number) { return MOCK_FLASHCARD_RECALL[i % MOCK_FLASHCARD_RECALL.length]; }
function areaCoverage(nodes: Array<{ progress?: number | string | null }>, fallback: number) {
  const validProgress = nodes.flatMap(node => {
    const progress = typeof node.progress === 'string'
      ? node.progress.toLowerCase() === 'studied' || node.progress === '3' ? 100
        : node.progress.toLowerCase() === 'inprogress' || node.progress === '2' ? 50 : 0
      : Number(node.progress);
    return Number.isFinite(progress) && node.progress !== null && node.progress !== undefined
      ? [Math.min(100, Math.max(0, progress))]
      : [];
  });
  if (!validProgress.length || validProgress.every(value => value === 0)) return fallback;
  return Math.round(validProgress.reduce((sum, value) => sum + value, 0) / validProgress.length);
}
function mockTopicScore(ai: number, ti: number) {
  return Math.max(10, Math.min(95, mockAcc(ai) + MOCK_TOPIC_DLT[ti % MOCK_TOPIC_DLT.length]));
}

export function JourneyView(props: JourneyViewProps) {
  const { journey, loading, onBack } = props;
  const [period, setPeriod] = useState<'7'|'14'|'30'|'all'>('all');
  const [accuracyPeriod, setAccuracyPeriod] = useState<'4'|'8'>('8');
  const [retentionPeriod, setRetentionPeriod] = useState<'4'|'8'>('8');
  const [disciplineSort, setDisciplineSort] = useState<{ key: DisciplineSort; direction: 'asc'|'desc' }>({ key: 'accuracy', direction: 'desc' });
  const [errorSort, setErrorSort] = useState<{ key: ErrorSort; direction: 'asc'|'desc' }>({ key: 'errors', direction: 'desc' });
  const [openArea, setOpenArea] = useState<number | null>(null);

  if (loading) return <StudyLoading label="Buscando os dados do concurso…" />;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  const totalTopics = journey.knowledgeAreas.reduce((t, a) => t + a.nodes.length, 0);
  const stageLabel  = journey.stage === EJourneyStage.Completed ? 'Concurso realizado' : journey.stage === EJourneyStage.PreNotice ? 'Pré-edital' : 'Pós-edital';
  const today       = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  /* ── mock data ── */
  const mockTotalMin   = journey.knowledgeAreas.reduce((s, _, i) => s + mockMin(i), 0);
  const mockTotalQ     = journey.knowledgeAreas.reduce((s, a, i) => s + Math.round(a.nodes.length * 9 + mockAcc(i) * 0.5), 0);
  const mockCorrect    = journey.knowledgeAreas.reduce((s, a, i) => {
    const q = Math.round(a.nodes.length * 9 + mockAcc(i) * 0.5);
    return s + Math.round(q * mockAcc(i) / 100);
  }, 0);
  const mockAccuracy   = mockTotalQ ? Math.round(mockCorrect / mockTotalQ * 100) : null;
  const mockDone       = Math.round(totalTopics * 0.38);
  const mockCovPct     = totalTopics ? Math.round(mockDone / totalTopics * 100) : 0;
  const mockStudyDays  = 47;
  const totalQ         = journey.knowledgeAreas.reduce((s,_,i) => s + mockQ(i), 0);
  const maxWeekMin     = Math.max(...MOCK_WEEK_MIN, 1);
  const avgDayMin      = Math.round(MOCK_WEEK_MIN.reduce((s,v) => s+v, 0) / 7);
  const bestDay        = WEEK_DAYS[MOCK_WEEK_MIN.indexOf(Math.max(...MOCK_WEEK_MIN))];
  const maxEvolAcc     = Math.max(...MOCK_EVOL_ACC, 1);
  const evolDelta      = MOCK_EVOL_ACC[MOCK_EVOL_ACC.length-1] - MOCK_EVOL_ACC[0];
  const accuracyStart = accuracyPeriod === '4' ? 4 : 0;
  const retentionStart = retentionPeriod === '4' ? 4 : 0;

  /* mapa de perdas */
  const areasWithLoss = journey.knowledgeAreas.map((a, i) => ({
    area: a, i,
    acc: mockAcc(i),
    lost: Math.round((1 - mockAcc(i) / 100) * (a.nodes.length * 9 + mockAcc(i) * 0.5)),
  })).sort((a, b) => b.lost - a.lost);
  const flashcardData = journey.knowledgeAreas.map((area, i) => ({ area, cards: mockFlashcards(i), reviews: mockFlashcardReviews(i), recall: mockFlashcardRecall(i) }));
  const totalFlashcards = flashcardData.reduce((sum, item) => sum + item.cards, 0);
  const maxFlashcards = Math.max(1, ...flashcardData.map(item => item.cards));
  const maxFlashcardReviews = Math.max(1, ...flashcardData.map(item => item.reviews));
  const areasByAccuracy = journey.knowledgeAreas.map((area, i) => ({ area, accuracy: mockAcc(i) })).sort((a, b) => b.accuracy - a.accuracy);
  const easiestAreas = areasByAccuracy.slice(0, 5);
  const hardestAreas = [...areasByAccuracy].reverse().slice(0, 5);
  const sortedDisciplineAreas = journey.knowledgeAreas.map((area, i) => ({ area, index: i, study: mockMin(i), coverage: areaCoverage(area.nodes, mockCoverage(i)), accuracy: mockAcc(i) })).sort((a, b) => {
    const direction = disciplineSort.direction === 'asc' ? 1 : -1;
    if (disciplineSort.key === 'discipline') return a.area.title.localeCompare(b.area.title, 'pt-BR') * direction;
    return (a[disciplineSort.key] - b[disciplineSort.key]) * direction;
  });
  const changeDisciplineSort = (key: DisciplineSort) => setDisciplineSort(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  const sortIndicator = (key: DisciplineSort) => disciplineSort.key === key ? (disciplineSort.direction === 'desc' ? ' ↓' : ' ↑') : '';
  const sortedErrorAreas = journey.knowledgeAreas.map((area, i) => {
    const errors = mockErr(i);
    const coverage = MOCK_PRED_PCT[i % MOCK_PRED_PCT.length];
    return { area, errors, withReason: Math.round(errors * coverage / 100), coverage, predominant: MOCK_PRED_ERR[i % MOCK_PRED_ERR.length] };
  }).sort((a, b) => {
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
        <JourneyProfileLink />
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
            <button className="jd-back-link" onClick={onBack}>
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Jornadas
            </button>
          </div>
        </div>

        {/* ── Stats strip: acumulado ── */}
        <div className="jd-stats-strip">
          <div className="jd-stat-pill">
            <span className="jd-stat-pill-icon p"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
            <div className="jd-stat-pill-body">
              <span className="jd-stat-pill-val">{fmtMin(mockTotalMin)}</span>
              <span className="jd-stat-pill-lbl">Horas totais</span>
            </div>
          </div>
          <div className="jd-stat-pill">
            <span className="jd-stat-pill-icon t"><svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></span>
            <div className="jd-stat-pill-body">
              <span className="jd-stat-pill-val">{mockTotalQ.toLocaleString('pt-BR')}</span>
              <span className="jd-stat-pill-lbl">Questões resolvidas</span>
            </div>
          </div>
          <div className="jd-stat-pill">
            <span className="jd-stat-pill-icon a"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg></span>
            <div className="jd-stat-pill-body">
              <span className="jd-stat-pill-val">{mockAccuracy === null ? '—' : `${mockAccuracy}%`}</span>
              <span className="jd-stat-pill-lbl">Acertos no geral</span>
            </div>
          </div>
          <div className="jd-stat-pill">
            <span className="jd-stat-pill-icon r"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
            <div className="jd-stat-pill-body">
              <span className="jd-stat-pill-val">{mockStudyDays}</span>
              <span className="jd-stat-pill-lbl">Dias estudados</span>
            </div>
          </div>
          <div className="jd-stat-pill">
            <span className="jd-stat-pill-icon g"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></span>
            <div className="jd-stat-pill-body">
              <span className="jd-stat-pill-val">{mockDone}/{totalTopics}</span>
              <span className="jd-stat-pill-lbl">Tópicos concluídos</span>
            </div>
          </div>
        </div>

        {/* ── Hoje — faixa compacta ── */}
        <div className="jd-today-strip">
          <span className="jd-today-strip-eyebrow">HOJE · <span style={journeyTokens.styles.today}>{today}</span></span>
          <CollapseButton label="resumo de hoje" />
          <div className="jd-today-strip-stats">
            <div className="jd-today-strip-stat">
              <strong>1h 20min</strong><small>Horas</small>
            </div>
            <div className="jd-today-strip-stat">
              <strong>34</strong><small>Questões</small>
            </div>
            <div className="jd-today-strip-stat">
              <strong>71%</strong><small>Acertos</small>
            </div>
            <div className="jd-today-strip-stat">
              <strong>2</strong><small>Sessões</small>
            </div>
            <div className="jd-today-strip-streak">🔥 3 dias seguidos</div>
          </div>
        </div>

        {/* ── Centro: Prontidão (anel) + Tempo por dia da semana (gráfico) ── */}
        <div className="jd-center">

          {/* Prontidão para prova */}
          {(() => {
            const application = mockAccuracy ?? 0;
            const retention = MOCK_RETENTION[MOCK_RETENTION.length - 1] ?? 0;
            const consistency = journeyTokens.mock.consistencyPercentage;
            const components  = [
              { label: 'Cobertura', val: mockCovPct, tip: 'Percentual de todo o edital que já foi estudado' },
              { label: 'Aplicação', val: application, tip: 'Se o conteúdo estudado está sendo aplicado corretamente nas questões' },
              { label: 'Retenção', val: retention, tip: 'Percentual de cards lembrados nas revisões' },
              { label: 'Consistência', val: consistency, tip: 'Regularidade dos estudos ao longo do tempo' },
            ];
            return (
              <div className="jd-ring-card">
                <h3>Situação da preparação</h3><CollapseButton label="situação da preparação" />
                <AccuracyRing pct={mockCovPct} sub="do edital consolidado" />
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
                const min    = MOCK_WEEK_MIN[i];
                const acc    = MOCK_WEEK_ACC[i];
                const height = Math.round(min / maxWeekMin * 100);
                const isBest = min === Math.max(...MOCK_WEEK_MIN);
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
              {MOCK_EVOL_WEEKS.slice(accuracyStart).map((week, visibleIndex) => {
                const i = visibleIndex + accuracyStart;
                const acc    = MOCK_EVOL_ACC[i];
                const height = Math.round(acc / maxEvolAcc * 100);
                const color  = domainColor(acc);
                return (
                  <div className="jd-evol-col" key={week}>
                    <span className="jd-evol-val" style={journeyTokens.styles.color(color)}>{acc}%</span>
                    <div className="jd-evol-bar-track">
                      <div className="jd-evol-bar" style={journeyTokens.styles.heightColor(height, color)}/>
                    </div>
                    <span className="jd-evol-label">{week}</span>
                  </div>
                );
              })}
            </div>
            <p className="jd-evol-tip">
              {MOCK_EVOL_ACC[MOCK_EVOL_ACC.length-1] >= 70
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
              {MOCK_RETENTION_WEEKS.slice(retentionStart).map((week, visibleIndex) => {
                const i = visibleIndex + retentionStart;
                const retention = MOCK_RETENTION[i];
                const height = Math.round(retention / Math.max(...MOCK_RETENTION, 1) * 100);
                return <div className="jd-evol-col" key={week}>
                  <span className="jd-evol-val jd-retention-val">{retention}%</span>
                  <div className="jd-evol-bar-track"><div className="jd-evol-bar jd-retention-bar" style={journeyTokens.styles.height(height)} /></div>
                  <span className="jd-evol-label">{week}</span>
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
              <small>{totalQ.toLocaleString('pt-BR')} total</small>
              <CollapseButton label="questões por disciplina" />
            </div>
            <div className="jd-effort-list">
              {[...journey.knowledgeAreas]
                .map((a,i) => ({ area:a, q:mockQ(i) }))
                .sort((a,b) => b.q - a.q)
                .map(({area, q}) => {
                  const pct = Math.round(q / totalQ * 100);
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
              {MOCK_ERR_TYPES.map(t => (
                <div className="jd-error-type-row" key={t.label}>
                  <span className="jd-error-type-label">{t.label}</span>
                  <div className="jd-ebar-track"><div className="jd-ebar" style={journeyTokens.styles.widthColor(t.pct, t.color)}/></div>
                  <span className="jd-error-type-pct" style={journeyTokens.styles.color(t.color)}>{t.pct}%</span>
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
                  {sortedErrorAreas.map(({ area, errors, withReason, coverage, predominant }) => {
                    return (
                      <tr key={area.id}>
                        <td className="jd-err-name">{area.title}</td>
                        <td className="jd-err-num">{errors}</td>
                        <td className="jd-err-num">{withReason}</td>
                        <td className="jd-err-num">{coverage.toFixed(1).replace('.',',')}%</td>
                        <td className="jd-err-pred">{predominant} <span>{Math.round(coverage * 0.6)}%</span></td>
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
                  const areaDomain = mockAcc(ai);
                  return (
                    <div className="jd-edital-area" key={area.id}>
                      <button className="jd-edital-area-header" onClick={() => setOpenArea(isOpen ? null : area.id)}>
                        <span className={`jd-domain-dot ${domainDot(areaDomain)}`} />
                        <span className="jd-edital-area-name">{area.title}</span>
                        <span className="jd-edital-area-count">{area.nodes.length}t</span>
                        <span className="jd-edital-area-score" style={journeyTokens.styles.color(domainColor(areaDomain))}>{areaDomain}%</span>
                        <svg className={`jd-chevron${isOpen?' open':''}`} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      {isOpen && (
                        <div className="jd-edital-topics">
                          {area.nodes.length
                            ? area.nodes.map((node, ti) => {
                                const score = mockTopicScore(ai, ti);
                                return (
                                  <div className="jd-edital-topic" key={node.id}>
                                    <span className={`jd-domain-dot small ${domainDot(score)}`} />
                                    <span className="jd-edital-topic-name">{node.title}</span>
                                    <span className="jd-edital-topic-score" style={journeyTokens.styles.color(domainColor(score))}>{score}%</span>
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

      <ContestFAB areas={journey.knowledgeAreas} />

    </div>
  );
}
