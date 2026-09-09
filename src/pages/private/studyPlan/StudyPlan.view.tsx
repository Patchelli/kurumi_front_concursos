import { Fragment, useEffect, useMemo, useState } from 'react';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import type { StudyPlanViewProps } from './StudyPlan.type';
import { studyPlanTokens } from './StudyPlan.tokens';
import { StudyTopicDialog, PlanConfigWizard, StudyCalendar, type StudyTopicTarget } from './StudyPlan.widgets';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { usePomodoro } from '../../../components/fab/Pomodoro.context';
import { ReviewDialog } from '@components/dialog/ReviewDialog';
import { QuestionRegisterDialog } from '@components/practice/QuestionRegisterDialog';
import { isStudyCompleted } from '@business/studyProgress';
import { JourneySidebarAccountActions } from '@components/layout/JourneyProfileLink';
import { JourneyMobileMenu } from '@components/layout/JourneyMobileMenu';
import { ConfirmDialog } from '@components/dialog/ConfirmDialog';

const TYPE_SLUG: Record<string, string> = { Teoria: 'teoria', Questões: 'questoes', Revisão: 'revisao' };
const TODAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const localToday = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const LOCAL_DATE = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

export function StudyPlanView({ journey, loading, configuration, routineBlocks, nodeStudy, onSaveConfiguration, onCompleteBlock, onSaveNodeStudy, onQuestionsSaved, onListResources, onSaveResource, onDeleteResource, onBack, onOverview, onOpenContent, onOpenCapsule, onOpenSimulados, onOpenSubject }: StudyPlanViewProps) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [revisions, setRevisions] = useState<Map<number, string>>(new Map()); // blockId → date
  const [reviewTarget, setReviewTarget] = useState<typeof blocks[number] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopicTarget | null>(null);
  const pomodoro = usePomodoro();
  const [tab, setTab] = useState<'novo' | 'revisao' | 'questoes'>('novo');
  const [questionTarget, setQuestionTarget] = useState<{ areaId: number; nodeId: number; title: string } | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [futureAccess, setFutureAccess] = useState<{ title: string; action(): void } | null>(null);

  useEffect(() => {
    setCompleted(new Set((routineBlocks ?? []).filter(block => block.status === 3 || String(block.status).toLowerCase() === 'completed').map(block => block.id)));
  }, [routineBlocks]);

  const todayBlocks = useMemo(() => {
    if (routineBlocks?.length) { return routineBlocks.filter(item => item.scheduledFor.slice(0, 10) === localToday).map(item => { const area = journey?.knowledgeAreas.find(a => a.nodes.some(n => n.id === item.syllabusNodeId)); const topic = area?.nodes.find(n => n.id === item.syllabusNodeId); return area && topic ? { id: item.id, area, topic, subject: area.title, type: item.type === 2 ? 'Revisão' : item.type === 3 ? 'Questões' : 'Teoria', minutes: item.plannedMinutes } : null; }).filter(Boolean) as Array<{ id: number; area: NonNullable<typeof journey>['knowledgeAreas'][number]; topic: NonNullable<typeof journey>['knowledgeAreas'][number]['nodes'][number]; subject: string; type: string; minutes: number }>; }
    return [];
  }, [journey, routineBlocks]);

  const blocks = todayBlocks.map(block => {
    const source = routineBlocks?.find(item => item.id === block.id);
    const rawType = String(source?.type ?? '').toLowerCase();
    const type = rawType === '2' || rawType === 'review' ? 'Revisão' : rawType === '3' || rawType === 'questions' ? 'Questões' : block.type;
    return { ...block, type, minutes: source && source.completedMinutes > 0 ? source.completedMinutes : block.minutes };
  });
  const pendingBlockIds = new Set((routineBlocks ?? []).filter(item => (item.status === 1 || String(item.status).toLowerCase() === 'pending') && item.completedMinutes > 0).map(item => item.id));

  if (loading) return <StudyLoading label="Montando seu plano de estudos…" />;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  const plannedMinutes = blocks.reduce((total, block) => total + (routineBlocks?.find(item => item.id === block.id)?.plannedMinutes ?? block.minutes), 0);
  const doneMinutes = blocks.reduce((total, block) => {
    const saved = routineBlocks?.find(item => item.id === block.id);
    return total + (saved?.completedMinutes ?? (completed.has(block.id) ? block.minutes : 0));
  }, 0);
  const progress = plannedMinutes ? Math.round(doneMinutes / plannedMinutes * 100) : 0;
  const currentWeekdayIndex = (new Date().getDay() + 6) % 7;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - currentWeekdayIndex);
  const weekDates = studyPlanTokens.weekdays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const weeklyMinutes = weekDates.map(date => (routineBlocks ?? [])
    .filter(block => block.scheduledFor.slice(0, 10) === date)
    .reduce((total, block) => total + block.completedMinutes, 0));
  const weeklyDoneMinutes = weeklyMinutes.reduce((total, minutes) => total + minutes, 0);

  const open = (block: typeof blocks[number]) => setSelectedTopic({ area: block.area, topic: block.topic });
  const isTopicComplete = (topic: typeof blocks[number]['topic']) => {
    if (topic.children.length > 0) {
      return topic.children.every(child =>
        isStudyCompleted(nodeStudy.find(item => item.syllabusNodeId === child.id)?.progress ?? child.progress)
      );
    }
    const block = blocks.find(item => item.topic.id === topic.id);
    return block ? completed.has(block.id) : isStudyCompleted(topic.progress);
  };

  async function completeBlock(id: number, completedMinutes: number, scheduleReview = false, reviewDate: string | null = null, isCompleted = true, clearPending = false, summary = '', studyLocation = '') {
    if (id < 0) {
      await onSaveNodeStudy({ journeyId: journey!.id, syllabusNodeId: -id, completed: true, studiedMinutes: 0, scheduleReview, reviewDate: scheduleReview ? reviewDate : null, summary: summary || null, studyLocation: studyLocation || null, isReview: true });
      return;
    }
    setCompleted(curr => { const next = new Set(curr); isCompleted ? next.add(id) : next.delete(id); return next; });
    await onCompleteBlock(id, isCompleted, completedMinutes, isCompleted && scheduleReview, isCompleted && scheduleReview ? reviewDate : null, clearPending, summary || null, studyLocation || null);
  }
  async function uncompleteBlock(id: number) {
    setCompleted(curr => { const next = new Set(curr); next.delete(id); return next; });
    setRevisions(curr => { const next = new Map(curr); next.delete(id); return next; });
    await onCompleteBlock(id, false, 0, false, null);
  }

  const novoBlocks = blocks.filter(b => b.type !== 'Revisão' && b.type !== 'Questões');
  // Backend-generated revision blocks + user-scheduled revisions from completed "Aprender" blocks
  const backendRevisoes = blocks.filter(b => b.type === 'Revisão');
  const futureRevisoes = (routineBlocks ?? []).filter(item => { const value = String(item.type).toLowerCase(); return value === '2' || value === 'review'; }).map(item => { const area = journey.knowledgeAreas.find(a => a.nodes.some(n => n.id === item.syllabusNodeId)); const topic = area?.nodes.find(n => n.id === item.syllabusNodeId); return area && topic ? { id: item.id, area, topic, subject: area.title, type: 'Revisão', minutes: item.plannedMinutes, scheduledFor: item.scheduledFor } : null; }).filter(Boolean) as any[];
  const subtopicRevisoes = nodeStudy.filter(item => item.reviewDate).map(item => {
    const area = journey.knowledgeAreas.find(candidate => candidate.nodes.some(root => root.id === item.syllabusNodeId || root.children.some(child => child.id === item.syllabusNodeId)));
    const topic = area?.nodes.find(root => root.id === item.syllabusNodeId || root.children.some(child => child.id === item.syllabusNodeId));
    const displayNode = topic?.children.find(child => child.id === item.syllabusNodeId);
    return area && topic ? { id: -item.syllabusNodeId, area, topic, displayTitle: displayNode?.title ?? topic.title, subject: area.title, type: 'Revisão', minutes: 0, scheduledFor: item.reviewDate } : null;
  }).filter(Boolean) as any[];
  const revisaoBlocks = [...backendRevisoes, ...futureRevisoes.filter(item => !backendRevisoes.some(current => current.id === item.id)), ...subtopicRevisoes.filter(item => !futureRevisoes.some(current => current.topic.id === item.topic.id && current.scheduledFor?.slice(0, 10) === item.scheduledFor?.slice(0, 10)))].sort((a, b) => String(a.scheduledFor ?? '').localeCompare(String(b.scheduledFor ?? '')));
  const questionBlocks = nodeStudy.filter(item => item.questionDate).map(item => {
    const area = journey.knowledgeAreas.find(candidate => candidate.nodes.some(root => root.id === item.syllabusNodeId || root.children.some(child => child.id === item.syllabusNodeId)));
    const topic = area?.nodes.find(root => root.id === item.syllabusNodeId || root.children.some(child => child.id === item.syllabusNodeId));
    const displayNode = topic?.children.find(child => child.id === item.syllabusNodeId);
    return area && topic ? { id: -item.syllabusNodeId, area, topic, displayTitle: displayNode?.title ?? topic.title, subject: area.title, type: 'Questões', minutes: 0, scheduledFor: item.questionDate, scheduledNodeId: item.syllabusNodeId } : null;
  }).filter(Boolean).sort((a, b) => String(a?.scheduledFor ?? '').localeCompare(String(b?.scheduledFor ?? ''))) as any[];
  const visibleBlocks = tab === 'novo' ? novoBlocks : tab === 'revisao' ? revisaoBlocks : questionBlocks;
  const todayIso = localToday;
  const tomorrowIso = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const openScheduledActivity = (block: typeof visibleBlocks[number], action: () => void) => {
    const scheduledFor = block.scheduledFor?.slice(0, 10);
    if ((block.type === 'Revisão' || block.type === 'Questões') && scheduledFor && scheduledFor > todayIso) {
      setFutureAccess({ title: (block as { displayTitle?: string }).displayTitle ?? block.topic.title, action });
      return;
    }
    action();
  };
  let lastScheduleGroup = '';

  return (
    <>
    <div className="jd-shell sp-shell">
      <JourneyMobileMenu active="plan" onOverview={onOverview} onSimulados={onOpenSimulados} onCapsule={onOpenCapsule} onContent={onOpenContent} onBack={onBack} />

      {/* ── Sidebar ── */}
      <aside className="jd-sidebar">
        <div className="jd-brand"><span>K</span><strong>Kurumí</strong></div>
        <nav className="jd-nav">
          <button onClick={onOverview}>
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <span>Visão geral</span>
          </button>
          <button className="active">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            <span>Plano de estudos</span>
          </button>
          <button onClick={onOpenSimulados}>
            <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span>Simulados</span>
          </button>
          <button onClick={onOpenCapsule}>
            <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6"/></svg>
            <span>Cápsula</span>
          </button>
          <button onClick={onOpenContent}>
            <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span>Conteúdo</span>
          </button>
        </nav>
        <JourneySidebarAccountActions />
        <div className="jd-contest-card">
          <div className="jd-thumb">
            {journey.logoUrl ? <img src={journey.logoUrl} alt="" /> : journey.title.slice(0, 2).toUpperCase()}
          </div>
          <div><strong>{journey.title}</strong><small>{journey.institution || 'Concurso'}</small></div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="sp-main">

        {!configOpen && <>

        {/* Header */}
        <header className="sp-header">
          <div>
            <span className="jd-page-context">PLANO DE ESTUDOS</span>
            <h1>Plano para hoje</h1>
            <p className="sp-header-date">{journey.title} <span>·</span> {TODAY}</p>
          </div>
          <button className="jd-back-link" onClick={onBack}>
            <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Jornadas
          </button>
        </header>

        {/* Progress strip */}
        <div className="sp-progress-strip">
          <div className="sp-ps-stats">
            <div className="sp-ps-stat">
              <strong>{completed.size}<span className="sp-ps-total">/{blocks.length}</span></strong>
              <small>Blocos</small>
            </div>
            <div className="sp-ps-divider" />
            <div className="sp-ps-stat">
              <strong>{doneMinutes}<span className="sp-ps-total">/{plannedMinutes}min</span></strong>
              <small>Tempo</small>
            </div>
          </div>
          <div className="sp-ps-bar-wrap">
            <div className="sp-ps-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="sp-ps-pct">{progress}%</span>
        </div>

        {/* Main grid */}
        <div className="sp-grid">

          {/* Left column: today blocks + calendar */}
          <div className="sp-main-col">
          <section className="sp-card sp-today">
            <header className="sp-today-header">
              <div>
                <span className="eyebrow">HOJE</span>
                <h2>Plano do dia</h2>
              </div>
              <button type="button" disabled>＋ Adicionar bloco</button>
            </header>

            <div className="sp-tabs">
              <button
                className={tab === 'novo' ? 'sp-tab sp-tab--active' : 'sp-tab'}
                onClick={() => setTab('novo')}
              >
                Aprender
                <span className="sp-tab-count">{novoBlocks.length}</span>
              </button>
              <button
                className={tab === 'revisao' ? 'sp-tab sp-tab--active' : 'sp-tab'}
                onClick={() => setTab('revisao')}
                aria-label="Revisão"
              >
                <svg viewBox="0 0 22 14" fill="none" aria-hidden="true">
                  <path d="M1 5l5 5L14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9l5 5L21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                </svg>
                Revisão
                <span className="sp-tab-count">{revisaoBlocks.length}</span>
              </button>
              <button className={tab === 'questoes' ? 'sp-tab sp-tab--active' : 'sp-tab'} onClick={() => setTab('questoes')} aria-label="Questões">
                Questões
                <span className="sp-tab-count">{questionBlocks.length}</span>
              </button>
            </div>

            {visibleBlocks.length ? (
              <div className="sp-block-list">
                {visibleBlocks.map((block, index) => {
                  const done = completed.has(block.id);
                  const lastStudyLocation = nodeStudy.find(item => item.syllabusNodeId === (block.scheduledNodeId ?? (block.id < 0 ? -block.id : block.topic.id)))?.lastStudyLocation;
                  const studyingNow = pomodoro.running && pomodoro.activeTopicId === block.topic.id;
                  const slug = TYPE_SLUG[block.type] ?? 'teoria';
                  const scheduleDate = (block as { scheduledFor?: string }).scheduledFor?.slice(0, 10);
                  const group = tab !== 'novo' ? (!scheduleDate || scheduleDate === todayIso ? 'Hoje' : scheduleDate === tomorrowIso ? 'Amanhã' : scheduleDate < todayIso ? 'Atrasadas' : 'Futuras') : '';
                  const showGroup = group && group !== lastScheduleGroup;
                  lastScheduleGroup = group;
                  const revDate = revisions.get(block.id) ?? (block.type === 'Revisão' ? block.scheduledFor?.slice(0, 10) : undefined);
                  const questionDate = block.type === 'Questões' ? block.scheduledFor?.slice(0, 10) : undefined;
                  return (
                    <Fragment key={`${tab}-${block.id}`}>
                    {showGroup && <div className={`sp-review-group sp-review-group--${group.toLowerCase()}`}>{group}</div>}
                    <article
                      key={`${tab}-${block.id}`}
                      className={`sp-block${done ? ' sp-block--done' : ''}${pendingBlockIds.has(block.id) ? ' sp-block--pending' : ''}${studyingNow ? ' sp-block--studying' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openScheduledActivity(block, () => tab === 'questoes' ? setQuestionTarget({ areaId: block.area.id, nodeId: block.scheduledNodeId ?? block.topic.id, title: block.displayTitle ?? block.topic.title }) : open(block))}
                      onKeyDown={e => e.key === 'Enter' && openScheduledActivity(block, () => tab === 'questoes' ? setQuestionTarget({ areaId: block.area.id, nodeId: block.scheduledNodeId ?? block.topic.id, title: block.displayTitle ?? block.topic.title }) : open(block))}
                    >
                      <button
                        className="sp-check"
                        type="button"
                        aria-label={`${done ? 'Desmarcar' : 'Concluir'} ${block.topic.title}`}
                        onClick={e => {
                          e.stopPropagation();
                          openScheduledActivity(block, () => {
                            if (tab === 'questoes') { setQuestionTarget({ areaId: block.area.id, nodeId: block.scheduledNodeId ?? block.topic.id, title: block.displayTitle ?? block.topic.title }); return; }
                            if (block.id < 0) { open(block); return; }
                            if (done) uncompleteBlock(block.id);
                            else setReviewTarget(block);
                          });
                        }}
                      >
                        {done ? '✓' : index + 1}
                      </button>

                      <div className="sp-block-body">
                        <div className="sp-block-meta">
                          <span className={`sp-type sp-type--${slug}`}>{block.type}</span>
                          <span className="sp-block-subject">{block.subject}</span>
                        </div>
                          <strong className="sp-block-title">{(block as { displayTitle?: string }).displayTitle ?? block.topic.title}</strong>
                        {block.type === 'Revisão' && lastStudyLocation && <span className="sp-block-hint" style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}>Último local: {lastStudyLocation}</span>}
                        <span className="sp-block-hint">
                          {studyingNow
                            ? '● Pomodoro em andamento'
                            : questionDate
                            ? `Questões em ${new Date(`${questionDate}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                            : revDate
                            ? `↻ Revisão em ${new Date(`${revDate}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                            : block.topic.children.length
                            ? `${block.topic.children.length} subtópico${block.topic.children.length > 1 ? 's' : ''}`
                            : 'Clique para ver as ações'}
                        </span>
                      </div>

                      <div className="sp-block-actions">
                        <time className="sp-block-time">{block.type === 'Revisão' ? 'tempo livre' : block.type === 'Questões' ? 'prática' : `${block.minutes}min`}</time>
                      </div>
                    </article>
                    </Fragment>
                  );
                })}
              </div>
            ) : (
              <div className={`sp-empty${tab === 'novo' && !configuration ? ' sp-empty--setup' : ''}`}>
                {tab === 'novo' ? (
                  !configuration ? (<>
                    <div className="sp-empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </div>
                    <strong>Nenhum ciclo configurado</strong>
                    <p>Defina disponibilidade, matérias e carga horária para gerar seu plano diário.</p>
                    <button className="sp-empty-cta" type="button" onClick={() => setConfigOpen(true)}>Configurar plano →</button>
                  </>) : (<>
                    <strong>Nenhum bloco para hoje</strong>
                    <p>Pode ser dia de folga ou as matérias ainda não têm tópicos cadastrados.</p>
                    <button className="sp-empty-link" type="button" onClick={() => setConfigOpen(true)}>Revisar configuração</button>
                  </>)
                ) : tab === 'revisao' ? (
                  <><strong>Nenhuma revisão agendada</strong><p>Complete tópicos para gerar revisões.</p></>
                ) : (
                  <><strong>Nenhuma questão agendada</strong><p>Conclua um tópico, subtópico ou revisão para gerar a prática.</p></>
                )}
              </div>
            )}
          </section>
          <StudyCalendar areas={journey.knowledgeAreas} routineBlocks={routineBlocks} nodeStudy={nodeStudy} />
          </div>{/* end sp-main-col */}

          {/* Right sidebar: config button + weekly goal */}
          <aside className="sp-side">
            <button className={`sp-config-btn${!configuration ? ' sp-config-btn--pulse' : ''}`} type="button" onClick={() => setConfigOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Configurar plano
            </button>
            <section className="sp-card sp-week-card">
              <span className="eyebrow">SEMANA</span>
              <h2>Meta semanal</h2>
              <strong className="sp-week-value">{weeklyDoneMinutes} <small>/ 600 min</small></strong>
              <div className="sp-progress"><i style={studyPlanTokens.styles.progress(weeklyDoneMinutes / 6)} /></div>
              <div className="sp-weekdays">
                {studyPlanTokens.weekdays.map((day, i) => (
                  <span className={i === currentWeekdayIndex ? 'active' : ''} key={day}>{day}<b>{weeklyMinutes[i]}</b></span>
                ))}
              </div>
            </section>
          </aside>

        </div>
        </>}{/* end !configOpen */}
      </main>


    </div>

    {/* Both outside jd-shell so position:fixed covers full viewport */}
    {reviewTarget && reviewTarget.type === 'Revisão' ? (
      <ReviewDialog
        mode="revision"
        title={reviewTarget.topic.title}
        previousSummary={nodeStudy.find(item => item.syllabusNodeId === (reviewTarget.id < 0 ? -reviewTarget.id : reviewTarget.topic.id))?.latestSummary}
        previousLocation={nodeStudy.find(item => item.syllabusNodeId === (reviewTarget.id < 0 ? -reviewTarget.id : reviewTarget.topic.id))?.lastStudyLocation}
        onClose={() => setReviewTarget(null)}
        onConfirm={(scheduleNext, nextDate, summary, studyLocation) => {
          void completeBlock(reviewTarget.id, 0, scheduleNext, scheduleNext ? nextDate : null, true, false, summary, studyLocation);
          if (scheduleNext) setRevisions(prev => new Map(prev).set(reviewTarget.id, nextDate));
          setReviewTarget(null);
        }}
      />
    ) : reviewTarget ? (
      <ReviewDialog
        title={reviewTarget.topic.title}
        previousSummary={nodeStudy.find(item => item.syllabusNodeId === reviewTarget.topic.id)?.latestSummary}
        previousLocation={nodeStudy.find(item => item.syllabusNodeId === reviewTarget.topic.id)?.lastStudyLocation}
        defaultMinutes={reviewTarget.minutes}
        onClose={() => setReviewTarget(null)}
        onConfirm={(schedule, date, completedMinutes, isCompleted, summary, studyLocation) => {
          void completeBlock(reviewTarget.id, completedMinutes, schedule, schedule ? date : null, isCompleted, false, summary, studyLocation);
          if (isCompleted && schedule) setRevisions(prev => new Map(prev).set(reviewTarget.id, date));
          setReviewTarget(null);
        }}
        pending={pendingBlockIds.has(reviewTarget.id)}
        onClearPending={() => {
          void completeBlock(reviewTarget.id, 0, false, null, false, true);
          setReviewTarget(null);
        }}
      />
    ) : null}
    <ConfirmDialog
      open={Boolean(futureAccess)}
      title="Antecipar atividade agendada?"
      description={futureAccess ? `“${futureAccess.title}” está programada para uma data futura. O espaçamento ajuda a fortalecer a memória e a medir melhor o que você realmente reteve. Se fizer agora, o intervalo planejado será antecipado. Deseja continuar mesmo assim?` : ''}
      confirmLabel="Continuar agora"
      cancelLabel="Manter na data"
      onClose={() => setFutureAccess(null)}
      onConfirm={() => { const action = futureAccess?.action; setFutureAccess(null); action?.(); }}
    />
    <StudyTopicDialog
      target={selectedTopic}
      completed={selectedTopic ? isTopicComplete(selectedTopic.topic) : false}
      onClose={() => setSelectedTopic(null)}
      onToggleComplete={() => { if (selectedTopic) { const block = blocks.find(b => b.topic.id === selectedTopic.topic.id); if (!block) return; isTopicComplete(selectedTopic.topic) ? void uncompleteBlock(block.id) : setReviewTarget(block); } }}
      journeyId={journey.id}
      onListResources={onListResources}
      nodeStudy={nodeStudy}
      onSaveNodeStudy={onSaveNodeStudy}
      onSaveResource={onSaveResource}
      onDeleteResource={onDeleteResource}
      onViewSubject={() => { if (selectedTopic) { setSelectedTopic(null); onOpenSubject(selectedTopic.area.id); } }}
      onStartPomodoro={subtopicId => { if (selectedTopic) { pomodoro.open({ areas: journey.knowledgeAreas, initialAreaId: selectedTopic.area.id, initialTopicId: selectedTopic.topic.id, initialSubtopicId: subtopicId }); } }}
    />
    {questionTarget && <QuestionRegisterDialog journeyId={journey.id} knowledgeAreaId={questionTarget.areaId} syllabusNodeId={questionTarget.nodeId} title={questionTarget.title} onClose={() => setQuestionTarget(null)} onSaved={() => { void onQuestionsSaved(); setQuestionTarget(null); }} />}
    <PlanConfigWizard
      open={configOpen}
      onClose={() => setConfigOpen(false)}
      journeyId={journey.id}
      areas={journey.knowledgeAreas}
      configuration={configuration}
      onSave={onSaveConfiguration}
    />
    <ContestFAB journeyId={journey.id} areas={journey.knowledgeAreas} />
    </>
  );
}
