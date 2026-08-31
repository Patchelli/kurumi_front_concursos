import { toast } from 'sonner';
import type { SubjectDetailViewProps, SubjectListViewProps } from './Subject.type';
import { TopicRow } from './Subject.widgets';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import { usePomodoro } from '../../../components/fab/Pomodoro.context';
import { isStudyCompleted } from '@business/studyProgress';
import { JourneyMobileProfileLink, JourneyProfileLink } from '@components/layout/JourneyProfileLink';

function Sidebar({ active, journeyTitle, journeyInstitution, logoUrl, onOverview, onStudyPlan, onOpenCapsule, onOpenSimulados }: {
  active: 'overview' | 'plan' | 'content' | 'capsule';
  journeyTitle: string; journeyInstitution?: string | null; logoUrl?: string | null;
  onOverview(): void; onStudyPlan(): void; onOpenCapsule(): void; onOpenSimulados(): void;
}) {
  return (
    <aside className="jd-sidebar">
      <div className="jd-brand"><span>K</span><strong>Kurumí</strong></div>
      <nav className="jd-nav">
        <button className={active === 'overview' ? 'active' : ''} onClick={onOverview}>
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <span>Visão geral</span>
        </button>
        <button className={active === 'plan' ? 'active' : ''} onClick={onStudyPlan}>
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <span>Plano de estudos</span>
        </button>
        <button onClick={onOpenSimulados}>
          <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span>Simulados</span>
        </button>
        <button className={active === 'capsule' ? 'active' : ''} onClick={onOpenCapsule}>
          <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6"/></svg>
          <span>Cápsula</span>
        </button>
        <button className={active === 'content' ? 'active' : ''}>
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span>Conteúdo</span>
        </button>
      </nav>
      <JourneyProfileLink />
      <div className="jd-contest-card">
        <div className="jd-thumb">
          {logoUrl ? <img src={logoUrl} alt="" /> : journeyTitle.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <strong>{journeyTitle}</strong>
          <small>{journeyInstitution || 'Concurso'}</small>
        </div>
      </div>
    </aside>
  );
}

export function SubjectListView({ journey, loading, onBack, onOpenStudyPlan, onOpenOverview, onOpenCapsule, onOpenSimulados, onSelectArea }: SubjectListViewProps) {
  if (loading) return <main className="journey-entry"><p>Carregando…</p></main>;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  const totalTopics = journey.knowledgeAreas.reduce((s, a) => s + a.nodes.length, 0);
  const doneTotal = journey.knowledgeAreas.reduce((s, a) => s + a.nodes.filter(n => isStudyCompleted(n.progress)).length, 0);

  return (
    <div className="jd-shell">
      <JourneyMobileProfileLink />
      <Sidebar active="content" journeyTitle={journey.title} journeyInstitution={journey.institution} logoUrl={journey.logoUrl} onOverview={onOpenOverview} onStudyPlan={onOpenStudyPlan} onOpenCapsule={onOpenCapsule} onOpenSimulados={onOpenSimulados} />
      <main className="sb-main">
        <div className="sb-topbar">
          <div>
            <span className="jd-page-context">CONTEÚDO</span>
            <h1 className="sb-page-title">Matérias</h1>
            <p className="sb-page-sub">{journey.title} • {doneTotal}/{totalTopics} tópicos concluídos</p>
          </div>
          <button className="jd-back-link" onClick={onBack}>
            <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Jornadas
          </button>
        </div>

        <div className="sb-area-section">
          {journey.knowledgeAreas.length ? (
            <div className="sb-area-list">
              {journey.knowledgeAreas.map(area => {
                const total = area.nodes.length;
                const done = area.nodes.filter(n => isStudyCompleted(n.progress)).length;
                const pct = total ? Math.round(done / total * 100) : 0;
                return (
                  <div className="sb-area-card" key={area.id} role="button" tabIndex={0}
                    onClick={() => onSelectArea(area.id)}
                    onKeyDown={e => e.key === 'Enter' && onSelectArea(area.id)}>
                    <div className="sb-area-info">
                      <span className="sb-area-name">{area.title}</span>
                      <span className="sb-area-meta">{done}/{total} tópico{total !== 1 ? 's' : ''} concluído{done !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="sb-area-progress-wrap">
                      <span className="sb-area-pct">{pct}%</span>
                      <div className="sb-area-track"><div className="sb-area-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <svg className="sb-area-chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sb-empty">
              <strong>Nenhuma matéria cadastrada</strong>
              <p>Adicione disciplinas ao edital na visão geral do concurso.</p>
            </div>
          )}
        </div>
      </main>
      <nav className="journey-mobile-nav">
        <button onClick={onOpenOverview}>◎<span>Visão geral</span></button>
        <button onClick={onOpenStudyPlan}>◷<span>Plano</span></button>
        <button onClick={onOpenSimulados}>▤<span>Simulados</span></button>
        <button className="active">☰<span>Conteúdo</span></button>
      </nav>
      <ContestFAB areas={journey.knowledgeAreas} />
    </div>
  );
}

export function SubjectDetailView({ journey, area, loading, onBack, onBackToList, onOpenStudyPlan, onOpenOverview, onOpenCapsule, onOpenSimulados, onRemoveNode, nodeStudy, onSaveNodeStudy, onListResources, onSaveResource, onDeleteResource }: SubjectDetailViewProps) {
  const pomodoro = usePomodoro();
  if (loading) return <main className="journey-entry"><p>Carregando…</p></main>;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;
  if (!area) return <main className="journey-entry"><button onClick={onBackToList}>← Matérias</button><h1>Matéria não encontrada</h1></main>;

  const total = area.nodes.length;
  const done = area.nodes.filter(node => {
    if (node.children.length > 0) {
      return node.children.every(child =>
        isStudyCompleted(nodeStudy.find(item => item.syllabusNodeId === child.id)?.progress ?? child.progress)
      );
    }
    return isStudyCompleted(nodeStudy.find(item => item.syllabusNodeId === node.id)?.progress ?? node.progress);
  }).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  return (
    <div className="jd-shell">
      <JourneyMobileProfileLink />
      <Sidebar active="content" journeyTitle={journey.title} journeyInstitution={journey.institution} logoUrl={journey.logoUrl} onOverview={onOpenOverview} onStudyPlan={onOpenStudyPlan} onOpenCapsule={onOpenCapsule} onOpenSimulados={onOpenSimulados} />
      <main className="sb-main">

        {/* Topbar */}
        <div className="sb-topbar">
          <div className="sb-detail-top">
            <button className="sb-back-btn" onClick={onBackToList}>
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Matérias
            </button>
            <div className="sb-subject-head">
              <h1 className="sb-subject-title">{area.title}</h1>
              <p className="sb-subject-meta">{pct}% concluído • {done} de {total} tópico{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="sb-subject-stats">
            <div className="sb-stat"><span className="sb-stat-val">—</span><span className="sb-stat-lbl">Horas</span></div>
            <div className="sb-stat"><span className="sb-stat-val">—</span><span className="sb-stat-lbl">Questões</span></div>
            <div className="sb-stat"><span className="sb-stat-val">—</span><span className="sb-stat-lbl">Acertos</span></div>
          </div>
        </div>

        {/* Topics */}
        <div className="sb-topics-section">
          <div className="sb-section-head">
            <span className="sb-section-label">TÓPICOS</span>
            <button className="sb-new-topic-btn" onClick={() => toast.info('Adicione tópicos na visão geral do concurso.')}>
              + Novo tópico
            </button>
          </div>
          {area.nodes.length ? (
            <div className="sb-topic-list">
              {area.nodes.map(topic => (
                <TopicRow
                  key={topic.id}
                  journeyId={journey.id}
                  knowledgeAreaId={area.id}
                  topic={topic}
                  onAddSubtopic={() => toast.info('Adicione subtópicos na visão geral do concurso.')}
                  onStartStudy={subtopicId => pomodoro.open({ areas: journey.knowledgeAreas, initialAreaId: area.id, initialTopicId: topic.id, initialSubtopicId: subtopicId })}
                  onRemove={() => onRemoveNode(topic.id)}
                  onRemoveSubtopic={onRemoveNode}
                  nodeStudy={nodeStudy}
                  onSaveNodeStudy={onSaveNodeStudy}
                  onListResources={onListResources}
                  onSaveResource={onSaveResource}
                  onDeleteResource={onDeleteResource}
                />
              ))}
            </div>
          ) : (
            <div className="sb-empty">
              <strong>Nenhum tópico cadastrado</strong>
              <p>Adicione tópicos a esta matéria na visão geral do concurso.</p>
            </div>
          )}
        </div>
      </main>
      <nav className="journey-mobile-nav">
        <button onClick={onOpenOverview}>◎<span>Visão geral</span></button>
        <button onClick={onOpenStudyPlan}>◷<span>Plano</span></button>
        <button onClick={onOpenSimulados}>▤<span>Simulados</span></button>
        <button className="active">☰<span>Conteúdo</span></button>
      </nav>
      <ContestFAB areas={journey.knowledgeAreas} />
    </div>
  );
}
