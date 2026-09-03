import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { SyllabusNodeResponse } from '@business/dto/response/journey.response';
import type { StudyResource, StudyResourceKind, StudyResourceRegisterRequest } from '@business/service/StudyResource.service';
import type { SyllabusNodeStudyRequest, SyllabusNodeStudyResponse } from '@business/service/SyllabusNodeStudy.service';
import { isStudyCompleted, isStudyPending, studyProgressPercent } from '@business/studyProgress';
import { ReviewDialog } from '@components/dialog/ReviewDialog';
import { FlashcardManager } from '@components/flashcard/FlashcardManager';
import { ContentViewer } from '@components/viewer/ContentViewer';

const unavail = (feature: string) => toast.info(`${feature} será conectado ao backend.`);

/* ── Flashcard List Panel ── */
export function FlashcardListPanel({ journeyId, knowledgeAreaId, syllabusNodeId, title, onClose }: {
  journeyId: number;
  knowledgeAreaId: number;
  syllabusNodeId?: number;
  title: string;
  onClose(): void;
}) {
  return (
    <div className="cv-overlay" onMouseDown={e => e.currentTarget === e.target && onClose()}>
      <div className="cv-url-form fc-list-panel">
        <div className="cv-bar">
          <span className="cv-title">Flashcards — {title}</span>
          <button className="cv-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="cv-form-body">
          <FlashcardManager journeyId={journeyId} areaId={knowledgeAreaId} nodeId={syllabusNodeId} subjectOnly={syllabusNodeId == null} />
        </div>
      </div>
    </div>
  );
}

const resourceKinds: Array<{ value: StudyResourceKind; label: string }> = [
  { value: 1, label: 'PDF' },
  { value: 2, label: 'Vídeo' },
  { value: 3, label: 'Apostila' },
  { value: 5, label: 'Site' },
  { value: 99, label: 'Outro' },
];

function resourceKindLabel(kind: number) {
  return resourceKinds.find(item => item.value === kind)?.label ?? 'Outro';
}

export function MaterialsPanel({ journeyId, knowledgeAreaId, nodeId, title, onList, onSave, onDelete, onClose, onLoaded }: {
  journeyId: number;
  knowledgeAreaId: number;
  nodeId?: number;
  title: string;
  onList(): Promise<StudyResource[]>;
  onSave(request: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDelete(id: number): Promise<void>;
  onClose(): void;
  onLoaded(count: number): void;
}) {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<StudyResourceKind>(99);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<StudyResource | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    onList()
      .then(items => {
        if (!active) return;
        setResources(items);
        onLoaded(items.length);
      })
      .catch(() => active && toast.error('Não foi possível carregar os materiais.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [nodeId, knowledgeAreaId]);

  async function save() {
    const url = input.trim();
    if (!url) return;
    setSaving(true);
    try {
      const saved = await onSave({
        journeyId,
        knowledgeAreaId,
        ...(nodeId ? { syllabusNodeId: nodeId } : {}),
        title: label.trim() || title,
        url,
        kind,
      });
      setResources(current => [saved, ...current]);
      onLoaded(resources.length + 1);
      setInput('');
      setLabel('');
      toast.success('Material salvo.');
    } catch {
      toast.error('Não foi possível salvar o material.');
    } finally { setSaving(false); }
  }

  async function remove(resource: StudyResource) {
    try {
      await onDelete(resource.id);
      setResources(current => current.filter(item => item.id !== resource.id));
      onLoaded(Math.max(0, resources.length - 1));
      if (viewer?.id === resource.id) setViewer(null);
      toast.success('Material removido.');
    } catch {
      toast.error('Não foi possível remover o material.');
    }
  }

  return (
    <div className="cv-overlay" onMouseDown={event => event.currentTarget === event.target && onClose()}>
      <div className="cv-url-form">
        <div className="cv-bar">
          <span className="cv-title">Material — {title}</span>
          <button className="cv-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="cv-form-body">
          <label className="cv-form-label">Materiais salvos
            <span className="cv-form-hint">PDF, vídeo, apostila ou qualquer link de estudo.</span>
          </label>
          {loading ? <p className="cv-form-hint">Carregando materiais…</p> : resources.length ? (
            <div className="sp-material-list">
              {resources.map(resource => <div key={resource.id}>
                <span>{resourceKindLabel(resource.kind)}</span>
                <button className="sp-resource-open" type="button" onClick={() => setViewer(resource)}>
                  <strong>{resource.title}</strong><small>{resource.url}</small>
                </button>
                <button className="sp-resource-delete" type="button" onClick={() => void remove(resource)} aria-label="Remover material">×</button>
              </div>)}
            </div>
          ) : <p className="cv-form-hint">Nenhum material cadastrado.</p>}
          <div className="sp-material-type-row">
            {resourceKinds.map(item => <button key={item.value} type="button" className={`sp-material-type-pill${kind === item.value ? ' active' : ''}`} onClick={() => setKind(item.value)}>{item.label}</button>)}
          </div>
          <input className="cv-url-input" type="text" placeholder="Descrição do material" value={label} onChange={event => setLabel(event.target.value)} />
          <input className="cv-url-input" type="url" placeholder="https://..." value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && !saving && void save()} />
          <div className="cv-form-actions">
            <button className="cv-save-btn" type="button" disabled={saving || !input.trim()} onClick={() => void save()}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </div>
      </div>
      {viewer && <ContentViewer url={viewer.url} title={viewer.title} onClose={() => setViewer(null)} />}
    </div>
  );
}

type SubtopicRowProps = { journeyId: number; knowledgeAreaId: number; child: SyllabusNodeResponse; studyState?: SyllabusNodeStudyResponse; onStartStudy(): void; onRemove(): void; onEditNode(nodeId: number, title: string): void; onSaveStudy(request: SyllabusNodeStudyRequest): Promise<SyllabusNodeStudyResponse>; onListResources(nodeId: number): Promise<StudyResource[]>; onSaveResource(request: StudyResourceRegisterRequest): Promise<StudyResource>; onDeleteResource(id: number): Promise<void> };
function SubtopicRow({ journeyId, knowledgeAreaId, child, studyState, onStartStudy, onRemove, onEditNode, onSaveStudy, onListResources, onSaveResource, onDeleteResource }: SubtopicRowProps) {
  const [done, setDone] = useState(() => isStudyCompleted(studyState?.progress ?? child.progress));
  const [studiedMinutes, setStudiedMinutes] = useState(() =>
    isStudyCompleted(studyState?.progress ?? child.progress) ? (studyState?.studiedMinutes ?? 0) : 0
  );
  const [revision, setRevision] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [hasMaterial, setHasMaterial] = useState(false);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const progress = studyProgressPercent(studyState?.progress ?? child.progress);
  const pending = isStudyPending(studyState?.progress ?? child.progress);
  useEffect(() => {
    if (saving) return;
    setDone(isStudyCompleted(studyState?.progress ?? child.progress));
    setRevision(Boolean(studyState?.reviewDate));
    setStudiedMinutes(isStudyCompleted(studyState?.progress ?? child.progress) ? (studyState?.studiedMinutes ?? 0) : 0);
  }, [studyState?.progress, studyState?.reviewDate, studyState?.studiedMinutes, child.progress, saving]);
  async function saveStudy(completed: boolean, minutes: number, scheduleReview: boolean, reviewDate: string | null, clearPending = false) {
    setSaving(true);
    try {
      const result = await onSaveStudy({ journeyId, syllabusNodeId: child.id, completed, studiedMinutes: minutes, scheduleReview, reviewDate, clearPending });
      setDone(isStudyCompleted(result.progress));
      setRevision(Boolean(result.reviewDate));
      setStudiedMinutes(completed ? result.studiedMinutes : 0);
    } catch { toast.error('NÃ£o foi possÃ­vel salvar o estudo do subtÃ³pico.'); }
    finally { setSaving(false); }
  }
  return (
    <div className="sb-subtopic-row">
      <span className="sb-subtopic-arrow">↳</span>
      <span className={`sb-subtopic-name${done ? ' sb-done-text' : ''}`} title={`${progress}%`}>{child.title}</span>
      <div className="sb-subtopic-actions">
        <button data-pomodoro-trigger className="sb-subtopic-btn" title="Iniciar estudo" onClick={onStartStudy} disabled={saving}>◷</button>
        <button className={`sb-subtopic-btn${hasMaterial ? ' sb-btn-has-material' : ''}`} title={hasMaterial ? 'Ver material' : 'Adicionar material'} onClick={() => setMaterialsOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button className="sb-subtopic-btn" title="Flashcards" onClick={() => setFlashcardsOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        <button className={`sb-subtopic-btn${done ? ' sb-btn-done' : ''}${pending ? ' sb-btn-pending' : ''}`} title={done ? 'Marcar pendente' : pending ? 'Editar pendência' : 'Concluir'} onClick={() => done ? void saveStudy(false, 0, false, null) : setReviewOpen(true)} disabled={saving}>{done ? '✓' : '○'}</button>
        <button className={`sb-subtopic-btn${revision ? ' sb-btn-revision' : ''}`} title={revision ? 'Alterar ou desmarcar revisão' : 'Agendar revisão'} onClick={() => setReviewOpen(true)} disabled={saving}>↻</button>
        <button className="sb-subtopic-btn" title="Editar subtópico" onClick={() => onEditNode(child.id, child.title)}>
          <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className="sb-subtopic-btn sb-delete-btn" title="Apagar subtópico" onClick={onRemove}>
          <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
      </div>
      {reviewOpen && <ReviewDialog title={child.title} defaultMinutes={Math.max(1, studiedMinutes || 60)} pending={pending} onClearPending={() => { void saveStudy(false, 0, false, null, true); setReviewOpen(false); }} onClose={() => setReviewOpen(false)} onConfirm={(schedule, date, minutes, completed) => { void saveStudy(completed, minutes, completed && schedule, completed && schedule ? date : null); setReviewOpen(false); toast.success(completed ? (schedule ? 'Revisão agendada.' : 'Subtópico concluído.') : 'Tempo do subtópico registrado.'); }} />}
      {materialsOpen && <MaterialsPanel journeyId={journeyId} knowledgeAreaId={knowledgeAreaId} nodeId={child.id} title={child.title} onList={() => onListResources(child.id)} onSave={onSaveResource} onDelete={onDeleteResource} onLoaded={count => setHasMaterial(count > 0)} onClose={() => setMaterialsOpen(false)} />}
      {flashcardsOpen && <FlashcardListPanel journeyId={journeyId} knowledgeAreaId={knowledgeAreaId} syllabusNodeId={child.id} title={child.title} onClose={() => setFlashcardsOpen(false)} />}
    </div>
  );
}

type TopicRowProps = {
  journeyId: number;
  knowledgeAreaId: number;
  topic: SyllabusNodeResponse;
  onAddSubtopic(): void;
  onStartStudy(subtopicId?: number): void;
  onRemove(): void;
  onRemoveSubtopic(id: number, title: string): void;
  nodeStudy: SyllabusNodeStudyResponse[];
  onSaveNodeStudy(request: SyllabusNodeStudyRequest): Promise<SyllabusNodeStudyResponse>;
  onEditNode(nodeId: number, title: string): void;
  onListResources(nodeId: number): Promise<StudyResource[]>;
  onSaveResource(request: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDeleteResource(id: number): Promise<void>;
};

export function TopicRow({ journeyId, knowledgeAreaId, topic, onAddSubtopic, onStartStudy, onRemove, onRemoveSubtopic, onEditNode, nodeStudy, onSaveNodeStudy, onListResources, onSaveResource, onDeleteResource }: TopicRowProps) {
  const topicState = nodeStudy.find(item => item.syllabusNodeId === topic.id);
  const completedChildren = topic.children.filter(child =>
    isStudyCompleted(nodeStudy.find(item => item.syllabusNodeId === child.id)?.progress ?? child.progress)
  ).length;
  const topicHasChildren = topic.children.length > 0;
  const topicProgress = topicHasChildren
    ? Math.round(completedChildren / topic.children.length * 100)
    : studyProgressPercent(topicState?.progress ?? topic.progress);
  const topicCompleted = topicHasChildren
    ? completedChildren === topic.children.length
    : isStudyCompleted(topicState?.progress ?? topic.progress);
  const topicPending = !topicCompleted && isStudyPending(topicState?.progress ?? topic.progress);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(topicCompleted);
  const [revision, setRevision] = useState(Boolean(topicState?.reviewDate));
  const [reviewOpen, setReviewOpen] = useState(false);
  const [studiedMinutes, setStudiedMinutes] = useState(topicState?.studiedMinutes ?? 0);
  const [saving, setSaving] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [hasMaterial, setHasMaterial] = useState(false);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const progress = topicProgress;
  useEffect(() => setDone(topicCompleted), [topicCompleted]);
  useEffect(() => {
    setRevision(Boolean(topicState?.reviewDate));
    setStudiedMinutes(topicState?.studiedMinutes ?? 0);
  }, [topicState?.reviewDate, topicState?.studiedMinutes]);
  async function saveTopicStudy(completed: boolean, minutes: number, scheduleReview: boolean, reviewDate: string | null, clearPending = false) {
    setSaving(true);
    try {
      const result = await onSaveNodeStudy({ journeyId, syllabusNodeId: topic.id, completed, studiedMinutes: minutes, scheduleReview, reviewDate, clearPending });
      setDone(isStudyCompleted(result.progress));
      setRevision(Boolean(result.reviewDate));
      setStudiedMinutes(result.studiedMinutes);
    } catch { toast.error('NÃ£o foi possÃ­vel salvar o estudo do tÃ³pico.'); }
    finally { setSaving(false); }
  }

  return (
    <div className={`sb-topic-card${open ? ' sb-open' : ''}${done ? ' sb-done' : ''}`}>
      <div className="sb-topic-header" role="button" tabIndex={0} onClick={() => setOpen(value => !value)} onKeyDown={event => event.key === 'Enter' && setOpen(value => !value)}>
        <button className="sb-expand-btn" type="button" aria-label={open ? 'Recolher' : 'Expandir'} onClick={event => { event.stopPropagation(); setOpen(value => !value); }}>
          <svg className={`sb-chevron-svg${open ? ' sb-chevron-svg--open' : ''}`} viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="sb-topic-text"><span className="sb-topic-name">{topic.title}</span><span className="sb-topic-progress">{progress}% concluído{topic.children.length ? ` · ${topic.children.length} subtópico${topic.children.length > 1 ? 's' : ''}` : ''}</span></div>
        <div className="sb-action-bar" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
          <button data-pomodoro-trigger className="sb-action-btn" title="Iniciar estudo" onClick={() => onStartStudy()} disabled={saving}>◷</button>
          <button className={`sb-action-btn${hasMaterial ? ' sb-btn-has-material' : ''}`} title={hasMaterial ? 'Ver material' : 'Adicionar material'} onClick={() => setMaterialsOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button className="sb-action-btn" title="Flashcards" onClick={() => setFlashcardsOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
          <button className={`sb-action-btn${done ? ' sb-btn-done' : ''}${topicPending ? ' sb-btn-pending' : ''}`} title={done ? 'Marcar como pendente' : topicPending ? 'Editar pendência' : 'Concluir tópico'} onClick={() => done ? void saveTopicStudy(false, 0, false, null) : setReviewOpen(true)} disabled={saving}>✓</button>
          <button className={`sb-revision-btn${revision ? ' sb-btn-revision' : ''}`} title={revision ? 'Alterar ou desmarcar revisão' : 'Marcar revisão'} onClick={() => setReviewOpen(true)} disabled={saving}>
            <svg viewBox="0 0 22 14" fill="none" aria-hidden="true"><path d="M1 5l5 5L14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 9l5 5L21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={revision ? '1' : '0.35'}/></svg>
          </button>
          <button className="sb-action-btn" title="Editar tópico" onClick={() => onEditNode(topic.id, topic.title)}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="sb-options-btn sb-delete-btn" title="Apagar tópico" onClick={onRemove}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>
      {open && <div className="sb-topic-body">
        <div className="sb-questions-block"><div className="sb-questions-head"><span className="sb-questions-label">◈ QUESTÕES</span><button className="sb-register-btn" onClick={() => unavail('O registro de questões')}>Registrar questões e horas de estudo</button></div><p className="sb-questions-empty">Nenhuma questão registrada ainda.</p></div>
        <div className="sb-subtopics-block">{topic.children.map(child => <SubtopicRow key={child.id} journeyId={journeyId} knowledgeAreaId={knowledgeAreaId} child={child} studyState={nodeStudy.find(item => item.syllabusNodeId === child.id)} onStartStudy={() => onStartStudy(child.id)} onRemove={() => onRemoveSubtopic(child.id, child.title)} onEditNode={onEditNode} onSaveStudy={onSaveNodeStudy} onListResources={onListResources} onSaveResource={onSaveResource} onDeleteResource={onDeleteResource} />)}<button className="sb-add-subtopic-btn" onClick={onAddSubtopic}><span>＋</span> adicionar subtópico</button></div>
      </div>}
      {reviewOpen && <ReviewDialog title={topic.title} defaultMinutes={Math.max(1, studiedMinutes || 60)} pending={topicPending} onClearPending={() => { void saveTopicStudy(false, 0, false, null, true); setReviewOpen(false); }} onClose={() => setReviewOpen(false)} onConfirm={(schedule, date, minutes, completed) => { void saveTopicStudy(completed, minutes, completed && schedule, completed && schedule ? date : null); setReviewOpen(false); toast.success(completed ? (schedule ? 'Revisão agendada.' : 'Tópico concluído.') : 'Tempo do tópico registrado.'); }} />}
      {materialsOpen && <MaterialsPanel journeyId={journeyId} knowledgeAreaId={knowledgeAreaId} nodeId={topic.id} title={topic.title} onList={() => onListResources(topic.id)} onSave={onSaveResource} onDelete={onDeleteResource} onLoaded={count => setHasMaterial(count > 0)} onClose={() => setMaterialsOpen(false)} />}
      {flashcardsOpen && <FlashcardListPanel journeyId={journeyId} knowledgeAreaId={knowledgeAreaId} syllabusNodeId={topic.id} title={topic.title} onClose={() => setFlashcardsOpen(false)} />}
    </div>
  );
}
