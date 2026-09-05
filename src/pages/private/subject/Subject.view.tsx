import { useState } from 'react';
import { toast } from 'sonner';
import type { SubjectDetailViewProps, SubjectListViewProps } from './Subject.type';
import { TopicRow, FlashcardListPanel, MaterialsPanel } from './Subject.widgets';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import { usePomodoro } from '../../../components/fab/Pomodoro.context';
import { isStudyCompleted } from '@business/studyProgress';
import { InputDialog } from '@components/dialog/InputDialog';
import { ConfirmDialog } from '@components/dialog/ConfirmDialog';
import { JourneyProfileLink } from '@components/layout/JourneyProfileLink';
import { JourneyMobileMenu } from '@components/layout/JourneyMobileMenu';
import { QuestionRegisterDialog } from '@components/practice/QuestionRegisterDialog';

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

export function SubjectListView({ journey, loading, onBack, onOpenStudyPlan, onOpenOverview, onOpenCapsule, onOpenSimulados, onSelectArea, onAddArea, onEditArea, onDeleteArea, onListResources, onSaveResource, onDeleteResource }: SubjectListViewProps) {
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [editAreaTarget, setEditAreaTarget] = useState<{ id: number; title: string } | null>(null);
  const [flashcardArea, setFlashcardArea] = useState<{ id: number; title: string } | null>(null);
  const [materialsArea, setMaterialsArea] = useState<{ id: number; title: string } | null>(null);
  const [deleteAreaTarget, setDeleteAreaTarget] = useState<{ id: number; title: string } | null>(null);
  if (loading) return <main className="journey-entry"><p>Carregando…</p></main>;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  const totalTopics = journey.knowledgeAreas.reduce((s, a) => s + a.nodes.length, 0);
  const doneTotal = journey.knowledgeAreas.reduce((s, a) => s + a.nodes.filter(n => isStudyCompleted(n.progress)).length, 0);

  return (
    <div className="jd-shell">
      <JourneyMobileMenu active="content" onOverview={onOpenOverview} onStudyPlan={onOpenStudyPlan} onSimulados={onOpenSimulados} onCapsule={onOpenCapsule} onBack={onBack} />
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
          <div className="sb-section-head">
            <span className="sb-section-label">MATÉRIAS</span>
            <button className="sb-new-topic-btn" onClick={() => setAddAreaOpen(true)}>+ Nova matéria</button>
          </div>
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
                    <div className="sb-area-actions" onClick={e => e.stopPropagation()}>
                      <button className="sb-area-edit-btn" title="Materiais" onClick={() => setMaterialsArea({ id: area.id, title: area.title })}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      </button>
                      <button className="sb-area-edit-btn" title="Flashcards" onClick={() => setFlashcardArea({ id: area.id, title: area.title })}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      </button>
                      <button className="sb-area-edit-btn" title="Editar matéria" onClick={() => setEditAreaTarget({ id: area.id, title: area.title })}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="sb-area-edit-btn sb-delete-btn" title="Apagar matéria" onClick={() => setDeleteAreaTarget({ id: area.id, title: area.title })}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
                      </button>
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
      <ContestFAB journeyId={journey.id} areas={journey.knowledgeAreas} />
      <InputDialog open={addAreaOpen} title="Nova matéria" description="Adicione uma disciplina ao edital deste concurso." placeholder="Ex: Direito Constitucional, Português…" maxLength={180} confirmLabel="Adicionar" onConfirm={onAddArea} onClose={() => setAddAreaOpen(false)} />
      <InputDialog open={!!editAreaTarget} title="Editar matéria" description="Altere o nome da disciplina." placeholder="Nome da matéria" defaultValue={editAreaTarget?.title ?? ''} maxLength={180} confirmLabel="Salvar" onConfirm={title => editAreaTarget && onEditArea(editAreaTarget.id, title)} onClose={() => setEditAreaTarget(null)} />
      {flashcardArea && <FlashcardListPanel journeyId={journey.id} knowledgeAreaId={flashcardArea.id} title={flashcardArea.title} onClose={() => setFlashcardArea(null)} />}
      {materialsArea && <MaterialsPanel journeyId={journey.id} knowledgeAreaId={materialsArea.id} title={materialsArea.title} onList={() => onListResources(materialsArea.id)} onSave={onSaveResource} onDelete={onDeleteResource} onLoaded={() => {}} onClose={() => setMaterialsArea(null)} />}
      <ConfirmDialog open={!!deleteAreaTarget} title="Excluir matéria?" description={`"${deleteAreaTarget?.title ?? ''}" e todo seu conteúdo serão removidos permanentemente.`} confirmLabel="Excluir" danger onConfirm={() => { if (deleteAreaTarget) onDeleteArea(deleteAreaTarget.id); setDeleteAreaTarget(null); }} onClose={() => setDeleteAreaTarget(null)} />
    </div>
  );
}

export function SubjectDetailView({ journey, area, loading, onBack, onBackToList, onOpenStudyPlan, onOpenOverview, onOpenCapsule, onOpenSimulados, onRemoveNode, onDeleteArea, onAddTopic, onAddSubtopic, onEditArea, onEditNode, nodeStudy, onSaveNodeStudy, onListResources, onSaveResource, onDeleteResource, onListAreaResources }: SubjectDetailViewProps) {
  const pomodoro = usePomodoro();
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [addSubtopicTarget, setAddSubtopicTarget] = useState<{ topicId: number; topicTitle: string } | null>(null);
  const [editAreaOpen, setEditAreaOpen] = useState(false);
  const [editNodeTarget, setEditNodeTarget] = useState<{ id: number; title: string } | null>(null);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [deleteAreaOpen, setDeleteAreaOpen] = useState(false);
  const [deleteNodeTarget, setDeleteNodeTarget] = useState<{ id: number; title: string } | null>(null);
  const [questionsOpen, setQuestionsOpen] = useState(false);
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
      <JourneyMobileMenu active="content" onOverview={onOpenOverview} onStudyPlan={onOpenStudyPlan} onSimulados={onOpenSimulados} onCapsule={onOpenCapsule} onBack={onBack} />
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
              <h1 className="sb-subject-title">
                {area.title}
                <button className="sb-edit-inline-btn" title="Registrar questões da matéria" onClick={() => setQuestionsOpen(true)}>Q</button>
                <button className="sb-edit-inline-btn" title="Materiais da matéria" onClick={() => setMaterialsOpen(true)}>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button className="sb-edit-inline-btn" title="Flashcards da matéria" onClick={() => setFlashcardsOpen(true)}>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
                <button className="sb-edit-inline-btn" title="Editar matéria" onClick={() => setEditAreaOpen(true)}>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="sb-edit-inline-btn sb-delete-btn" title="Apagar matéria" onClick={() => setDeleteAreaOpen(true)}>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              </h1>
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
            <button className="sb-new-topic-btn" onClick={() => setAddTopicOpen(true)}>
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
                  onAddSubtopic={() => setAddSubtopicTarget({ topicId: topic.id, topicTitle: topic.title })}
                  onStartStudy={subtopicId => pomodoro.open({ areas: journey.knowledgeAreas, initialAreaId: area.id, initialTopicId: topic.id, initialSubtopicId: subtopicId })}
                  onRemove={() => setDeleteNodeTarget({ id: topic.id, title: topic.title })}
                  onRemoveSubtopic={(id, title) => setDeleteNodeTarget({ id, title })}
                  onEditNode={(nodeId, title) => setEditNodeTarget({ id: nodeId, title })}
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
      <ContestFAB journeyId={journey.id} areas={journey.knowledgeAreas} />
      <InputDialog open={addTopicOpen} title="Novo tópico" description={`Adicione um tópico em ${area.title}.`} placeholder="Ex: Interpretação de texto, Funções…" maxLength={300} confirmLabel="Adicionar" onConfirm={title => onAddTopic(area.id, title)} onClose={() => setAddTopicOpen(false)} />
      <InputDialog open={!!addSubtopicTarget} title="Novo subtópico" description={addSubtopicTarget ? `Subtópico de "${addSubtopicTarget.topicTitle}".` : ''} placeholder="Ex: Coesão e coerência, Derivação…" maxLength={300} confirmLabel="Adicionar" onConfirm={title => addSubtopicTarget && onAddSubtopic(area.id, addSubtopicTarget.topicId, title)} onClose={() => setAddSubtopicTarget(null)} />
      <InputDialog open={editAreaOpen} title="Editar matéria" description="Altere o nome da disciplina." placeholder="Nome da matéria" defaultValue={area.title} maxLength={180} confirmLabel="Salvar" onConfirm={title => onEditArea(area.id, title)} onClose={() => setEditAreaOpen(false)} />
      <InputDialog open={!!editNodeTarget} title="Editar conteúdo" description="Altere o nome do tópico ou subtópico." placeholder="Nome" defaultValue={editNodeTarget?.title ?? ''} maxLength={300} confirmLabel="Salvar" onConfirm={title => editNodeTarget && onEditNode(editNodeTarget.id, area.id, title)} onClose={() => setEditNodeTarget(null)} />
      {flashcardsOpen && <FlashcardListPanel journeyId={journey.id} knowledgeAreaId={area.id} title={area.title} onClose={() => setFlashcardsOpen(false)} />}
      {questionsOpen && <QuestionRegisterDialog journeyId={journey.id} knowledgeAreaId={area.id} title={area.title} onClose={() => setQuestionsOpen(false)} />}
      {materialsOpen && <MaterialsPanel journeyId={journey.id} knowledgeAreaId={area.id} title={area.title} onList={() => onListAreaResources(area.id)} onSave={onSaveResource} onDelete={onDeleteResource} onLoaded={() => {}} onClose={() => setMaterialsOpen(false)} />}
      <ConfirmDialog open={deleteAreaOpen} title="Excluir matéria?" description={`"${area.title}" e todo seu conteúdo serão removidos permanentemente.`} confirmLabel="Excluir" danger onConfirm={() => { onDeleteArea(area.id); setDeleteAreaOpen(false); }} onClose={() => setDeleteAreaOpen(false)} />
      <ConfirmDialog open={!!deleteNodeTarget} title="Excluir conteúdo?" description={`"${deleteNodeTarget?.title ?? ''}" será removido permanentemente.`} confirmLabel="Excluir" danger onConfirm={() => { if (deleteNodeTarget) onRemoveNode(deleteNodeTarget.id); setDeleteNodeTarget(null); }} onClose={() => setDeleteNodeTarget(null)} />
    </div>
  );
}
