import { useMemo, useState } from 'react';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import type { StudyPlanViewProps } from './StudyPlan.type';
import { studyPlanTokens } from './StudyPlan.tokens';
import { StudyTopicDialog, PlanConfigWizard, StudyCalendar, type StudyTopicTarget } from './StudyPlan.widgets';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { usePomodoro } from '../../../components/fab/Pomodoro.context';

const TYPE_SLUG: Record<string, string> = { Teoria: 'teoria', Questões: 'questoes', Revisão: 'revisao' };
const TODAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export function StudyPlanView({ journey, loading, onBack, onOverview, onOpenContent, onOpenCapsule, onOpenSimulados, onOpenSubject }: StudyPlanViewProps) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<StudyTopicTarget | null>(null);
  const pomodoro = usePomodoro();
  const [tab, setTab] = useState<'novo' | 'hoje' | 'atrasadas' | 'futuras'>('novo');
  const [configOpen, setConfigOpen] = useState(false);

  const blocks = useMemo(() =>
    journey?.knowledgeAreas
      .flatMap((area, ai) => area.nodes.slice(0, 2).map((topic, ti) => ({
        id: topic.id, area, topic,
        subject: area.title,
        type: studyPlanTokens.blockTypes[(ai + ti) % studyPlanTokens.blockTypes.length],
        minutes: studyPlanTokens.durations[(ai + ti) % studyPlanTokens.durations.length],
      })))
      .slice(0, 8) ?? []
  , [journey]);

  if (loading) return <StudyLoading label="Montando seu plano de estudos…" />;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  const plannedMinutes = blocks.reduce((s, b) => s + b.minutes, 0);
  const doneMinutes = blocks.filter(b => completed.has(b.id)).reduce((s, b) => s + b.minutes, 0);
  const progress = plannedMinutes ? Math.round(doneMinutes / plannedMinutes * 100) : 0;

  const toggle = (id: number) => setCompleted(curr => { const next = new Set(curr); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const open = (block: typeof blocks[number]) => setSelectedTopic({ area: block.area, topic: block.topic });

  const novoBlocks = blocks.filter(b => b.type !== 'Revisão');
  const baseRevisoes = blocks.filter(b => b.type === 'Revisão');
  const revisaoBlocks = baseRevisoes.length >= 6 ? baseRevisoes : Array.from({ length: 6 }, (_, index) => {
    const source = blocks[index % Math.max(1, blocks.length)];
    return source ? { ...source, id: source.id + 10000 + index, topic: { ...source.topic, id: source.topic.id + 10000 + index, title: `${source.topic.title} · revisão ${index + 1}` }, type: 'Revisão' as const } : null;
  }).filter(Boolean) as typeof blocks;
  const revisaoHoje = revisaoBlocks.filter((_, index) => index % 3 === 0);
  const revisaoAtrasadas = revisaoBlocks.filter((_, index) => index % 3 === 1);
  const revisaoFuturas = revisaoBlocks.filter((_, index) => index % 3 === 2);
  const formatShortDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const todayDate = new Date();
  const overdueDate = new Date(todayDate); overdueDate.setDate(overdueDate.getDate() - 2);
  const futureDate = new Date(todayDate); futureDate.setDate(futureDate.getDate() + 3);
  const visibleBlocks = tab === 'novo' ? novoBlocks : [...revisaoHoje, ...revisaoAtrasadas, ...revisaoFuturas];

  return (
    <>
    <div className="jd-shell sp-shell">

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
                className={tab !== 'novo' ? 'sp-tab sp-tab--active' : 'sp-tab'}
                onClick={() => setTab('hoje')}
                aria-label="Revisão"
              >
                <svg viewBox="0 0 22 14" fill="none" aria-hidden="true">
                  <path d="M1 5l5 5L14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9l5 5L21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                </svg>
                Revisão
                <span className="sp-tab-count">{revisaoBlocks.length}</span>
              </button>
            </div>

            {visibleBlocks.length ? (
              <div className="sp-block-list">
                {visibleBlocks.map((block, index) => {
                  const groupTitle = tab !== 'novo' && (index === 0 ? `Hoje · ${revisaoHoje.length}` : index === revisaoHoje.length ? `Atrasadas · ${revisaoAtrasadas.length}` : index === revisaoHoje.length + revisaoAtrasadas.length ? `Futuras · ${revisaoFuturas.length}` : '');
                  const groupDate = tab !== 'novo' && (index === 0 ? formatShortDate(todayDate) : index === revisaoHoje.length ? formatShortDate(overdueDate) : index === revisaoHoje.length + revisaoAtrasadas.length ? formatShortDate(futureDate) : '');
                  const done = completed.has(block.id);
                  const studyingNow = pomodoro.running && pomodoro.activeTopicId === block.topic.id;
                  const slug = TYPE_SLUG[block.type] ?? 'teoria';
                  const isRevHoje = tab !== 'novo' && index < revisaoHoje.length;
                  const isRevAtrasada = tab !== 'novo' && index >= revisaoHoje.length && index < revisaoHoje.length + revisaoAtrasadas.length;
                  return (
                    <div key={block.id}>{groupTitle && <div className={`sp-revision-group-title${isRevHoje ? ' sp-rgt--hoje' : isRevAtrasada ? ' sp-rgt--atrasada' : ' sp-rgt--futura'}`}><span>{groupTitle}</span><small>{groupDate}</small></div>}<article
                      key={block.id}
                      className={`sp-block${done ? ' sp-block--done' : ''}${isRevHoje ? ' sp-block--rev-hoje' : ''}${studyingNow ? ' sp-block--studying' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => open(block)}
                      onKeyDown={e => e.key === 'Enter' && open(block)}
                    >
                      <button
                        className="sp-check"
                        type="button"
                        aria-label={`${done ? 'Desmarcar' : 'Concluir'} ${block.topic.title}`}
                        onClick={e => { e.stopPropagation(); toggle(block.id); }}
                      >
                        {done ? '✓' : index + 1}
                      </button>

                      <div className="sp-block-body">
                        <div className="sp-block-meta">
                          <span className={`sp-type sp-type--${slug}`}>{block.type}</span>
                          <span className="sp-block-subject">{block.subject}</span>
                        </div>
                        <strong className="sp-block-title">{block.topic.title}</strong>
                        <span className="sp-block-hint">
                          {studyingNow ? '● Pomodoro em andamento' : block.topic.children.length
                            ? `${block.topic.children.length} subtópico${block.topic.children.length > 1 ? 's' : ''}`
                            : 'Clique para ver as ações'}
                        </span>
                      </div>

                      <div className="sp-block-actions">
                        <time className="sp-block-time">{block.minutes}min</time>
                      </div>
                    </article></div>
                  );
                })}
              </div>
            ) : (
              <div className="sp-empty">
                {tab === 'novo'
                  ? <><strong>Nenhum conteúdo novo para hoje</strong><p>Adicione tópicos às matérias para gerar o plano.</p></>
                  : <><strong>Nenhuma revisão agendada</strong><p>Complete tópicos e agende revisões para vê-las aqui.</p></>
                }
              </div>
            )}
          </section>
          <StudyCalendar areas={journey.knowledgeAreas} />
          </div>{/* end sp-main-col */}

          {/* Right sidebar: config button + weekly goal */}
          <aside className="sp-side">
            <button className="sp-config-btn" type="button" onClick={() => setConfigOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Configurar plano
            </button>
            <section className="sp-card sp-week-card">
              <span className="eyebrow">SEMANA</span>
              <h2>Meta semanal</h2>
              <strong className="sp-week-value">{doneMinutes} <small>/ 600 min</small></strong>
              <div className="sp-progress"><i style={studyPlanTokens.styles.progress(doneMinutes / 6)} /></div>
              <div className="sp-weekdays">
                {studyPlanTokens.weekdays.map((day, i) => (
                  <span className={i === 0 ? 'active' : ''} key={day}>{day}<b>{i === 0 ? doneMinutes : 0}</b></span>
                ))}
              </div>
            </section>
          </aside>

        </div>
        </>}{/* end !configOpen */}
      </main>

      {/* ── Mobile nav ── */}
      <nav className="journey-mobile-nav">
        <button onClick={onOverview}>◎<span>Visão geral</span></button>
        <button className="active">◷<span>Plano</span></button>
        <button onClick={onOpenCapsule}>✉<span>Cápsula</span></button>
        <button onClick={onOpenContent}>☰<span>Conteúdo</span></button>
      </nav>

    </div>

    {/* Both outside jd-shell so position:fixed covers full viewport */}
    <StudyTopicDialog
      target={selectedTopic}
      completed={selectedTopic ? completed.has(selectedTopic.topic.id) : false}
      onClose={() => setSelectedTopic(null)}
      onToggleComplete={() => selectedTopic && toggle(selectedTopic.topic.id)}
      onViewSubject={() => { if (selectedTopic) { setSelectedTopic(null); onOpenSubject(selectedTopic.area.id); } }}
      onStartPomodoro={subtopicId => { if (selectedTopic) { pomodoro.open({ areas: journey.knowledgeAreas, initialAreaId: selectedTopic.area.id, initialTopicId: selectedTopic.topic.id, initialSubtopicId: subtopicId }); } }}
    />
    <PlanConfigWizard
      open={configOpen}
      onClose={() => setConfigOpen(false)}
      areas={journey.knowledgeAreas}
    />
    <ContestFAB areas={journey.knowledgeAreas} />
    </>
  );
}
