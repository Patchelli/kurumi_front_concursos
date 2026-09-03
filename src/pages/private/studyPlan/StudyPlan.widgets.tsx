import { useState, useEffect, useRef, useCallback } from 'react';
import { ContentViewer } from '../../../components/viewer/ContentViewer';
import { toast } from 'sonner';
import type { StudyRoutineConfigurationRequest } from '@business/dto/request/studyRoutine.request';
import type { KnowledgeAreaResponse, SyllabusNodeResponse } from '@business/dto/response/journey.response';
import type { StudyRoutineBlockResponse } from '@business/service/StudyRoutine.service';
import type { StudyResource, StudyResourceKind, StudyResourceRegisterRequest } from '@business/service/StudyResource.service';
import type { SyllabusNodeStudyRequest, SyllabusNodeStudyResponse } from '@business/service/SyllabusNodeStudy.service';
import { isStudyCompleted, isStudyPending, studyProgressPercent } from '@business/studyProgress';
import { ReviewDialog } from '@components/dialog/ReviewDialog';
import { FlashcardManager } from '@components/flashcard/FlashcardManager';
import { flashcardService, type FlashcardResponse } from '@business/service/Flashcard.service';

/* ════════════════════════════════════════════
   Study Calendar
   ════════════════════════════════════════════ */
const PT_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PT_WD = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
const CAL_BG   = ['#ede7f9','#dde8fd','#d9f2ec','#fde7d9','#f2d9e7','#e7f2d9','#fdf5d9'];
const CAL_TEXT = ['#543c78','#2348a8','#1a6e54','#a85023','#a82348','#3a6e1a','#a87823'];

export function StudyCalendar({ areas, routineBlocks = [], nodeStudy = [] }: { areas: KnowledgeAreaResponse[]; routineBlocks?: StudyRoutineBlockResponse[]; nodeStudy?: SyllabusNodeStudyResponse[] }) {
  const now = new Date();
  const [view, setView] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const year  = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 0=Sun offset → Mon-based offset
  const rawFirst = new Date(year, month, 1).getDay();
  const offset = rawFirst === 0 ? 6 : rawFirst - 1;

  // Os blocos exibidos vêm exclusivamente do gerador do backend.
  const items: { node: KnowledgeAreaResponse['nodes'][number]; areaTitle: string; colorIdx: number; plannedMinutes: number; type: number }[] = [];

  // Build schedule: up to 4 topics per weekday, cycling through items
  const CAL_MAX_VISIBLE = 2;
  const schedule: Record<number, typeof items[0][]> = {};
  const findNode = (area: KnowledgeAreaResponse, nodeId: number): SyllabusNodeResponse | undefined => {
    for (const node of area.nodes) {
      if (node.id === nodeId) return node;
      const child = node.children.find(item => item.id === nodeId);
      if (child) return child;
      const descendant = node.children.map(item => findNode({ ...area, nodes: [item] }, nodeId)).find(Boolean);
      if (descendant) return descendant;
    }
    return undefined;
  };
  if (routineBlocks.length) routineBlocks.forEach(block => { const [y, m, d] = block.scheduledFor.slice(0, 10).split('-').map(Number); if (y === year && m === month + 1) { const area = areas.find(a => findNode(a, block.syllabusNodeId)); const node = area ? findNode(area, block.syllabusNodeId) : undefined; if (area && node) (schedule[d] ??= []).push({ node, areaTitle: area.title, colorIdx: areas.indexOf(area) % CAL_BG.length, plannedMinutes: block.plannedMinutes, type: block.type }); } });
  nodeStudy.forEach(state => {
    if (!state.reviewDate || routineBlocks.some(block => block.syllabusNodeId === state.syllabusNodeId && block.scheduledFor.slice(0, 10) === state.reviewDate)) return;
    const [y, m, d] = state.reviewDate.slice(0, 10).split('-').map(Number);
    if (y !== year || m !== month + 1) return;
    const area = areas.find(item => findNode(item, state.syllabusNodeId));
    const node = area ? findNode(area, state.syllabusNodeId) : undefined;
    if (area && node) (schedule[d] ??= []).push({ node, areaTitle: area.title, colorIdx: areas.indexOf(area) % CAL_BG.length, plannedMinutes: 0, type: 2 });
  });

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = (d: number) => d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  const activityType = (type: number | string) => { const value = String(type).toLowerCase(); return value === '2' || value === 'review' ? 'Revisão' : value === '3' || value === 'questions' ? 'Questões' : 'Teoria'; };
  const selectedDate = selectedDay === null ? '' : new Date(year, month, selectedDay).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  useEffect(() => {
    if (selectedDay === null) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDay(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedDay]);

  return (
    <section className="sp-card sp-calendar">
      <div className="sp-cal-head">
        <button type="button" className="sp-cal-nav" aria-label="Mês anterior" onClick={() => { setSelectedDay(null); setView(new Date(year, month - 1, 1)); }}>‹</button>
        <h2>{PT_MONTHS[month]} {year}</h2>
        <button type="button" className="sp-cal-nav" aria-label="Próximo mês" onClick={() => { setSelectedDay(null); setView(new Date(year, month + 1, 1)); }}>›</button>
      </div>
      <div className="sp-cal-grid">
        {PT_WD.map(wd => <div key={wd} className="sp-cal-wd">{wd}</div>)}
        {cells.map((d, i) => (
          <button
            type="button"
            key={i}
            className={`sp-cal-cell${!d ? ' sp-cal-cell--empty' : ''}${d && isToday(d) ? ' sp-cal-cell--today' : ''}`}
            disabled={!d}
            aria-label={d ? `Ver conteúdos de ${d} de ${PT_MONTHS[month]}` : undefined}
            onClick={() => d && setSelectedDay(d)}
          >
            {d && <span className="sp-cal-dn">{d}</span>}
            {d && schedule[d]?.slice(0, CAL_MAX_VISIBLE).map((item, bi) => (
              <div
                key={bi}
                className="sp-cal-block"
                title={`${item.areaTitle}: ${item.node.title}`}
                style={{ background: CAL_BG[item.colorIdx], color: CAL_TEXT[item.colorIdx] }}
              >
                {item.node.title.slice(0, 14)}
              </div>
            ))}
            {d && (schedule[d]?.length ?? 0) > CAL_MAX_VISIBLE && (
              <div className="sp-cal-more">+{(schedule[d]?.length ?? 0) - CAL_MAX_VISIBLE}</div>
            )}
          </button>
        ))}
      </div>
      {!routineBlocks.length && !nodeStudy.some(item => Boolean(item.reviewDate)) && (
        <p className="sp-cal-empty">Configure o ciclo de estudos para ver os blocos no calendário.</p>
      )}
      {selectedDay !== null && (
        <div className="sp-day-modal-backdrop" role="presentation" onMouseDown={() => setSelectedDay(null)}>
          <div className="sp-day-modal" role="dialog" aria-modal="true" aria-labelledby="sp-day-modal-title" onMouseDown={event => event.stopPropagation()}>
            <div className="sp-day-modal-head">
              <div>
                <span>Plano do dia</span>
                <h3 id="sp-day-modal-title">{selectedDate}</h3>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setSelectedDay(null)}>×</button>
            </div>
            {(schedule[selectedDay]?.length ?? 0) > 0 ? (
              <div className="sp-day-modal-list">
                {schedule[selectedDay].map((item, index) => {
                  const typeLabel = activityType(item.type);
                  const typeSlug = typeLabel === 'Revisão' ? 'revisao' : typeLabel === 'Questões' ? 'questoes' : 'teoria';
                  return (
                    <article key={`${item.node.id}-${index}`} className={`sp-day-modal-item sp-day-modal-item--${typeSlug}`}>
                      <i />
                      <div>
                        <small>{item.areaTitle}</small>
                        <strong>{item.node.title}</strong>
                        <span>{typeLabel} · {item.plannedMinutes} min</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="sp-day-modal-empty">Nenhum conteúdo planejado para este dia.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════
   Plan Config Wizard (full-area)
   ════════════════════════════════════════════ */
type ConfigStep = 1 | 2 | 3 | 4;
type Affinity = 'Muito alta' | 'Alta' | 'Neutra' | 'Baixa' | 'Muito baixa';
const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'] as const;
type Day = typeof DAYS[number];

const AFFINITY_TO_PRIORITY: Record<Affinity, { label: string; color: string }> = {
  'Muito alta':  { label: 'Baixa',  color: '#22907a' },
  'Alta':        { label: 'Baixa',  color: '#22907a' },
  'Neutra':      { label: 'Média',  color: '#c87030' },
  'Baixa':       { label: 'Alta',   color: '#b03055' },
  'Muito baixa': { label: 'Alta',   color: '#b03055' },
};

const AFFINITY_MULTIPLIER: Record<Affinity, number> = {
  'Muito alta':  0.5,
  'Alta':        0.75,
  'Neutra':      1.0,
  'Baixa':       1.5,
  'Muito baixa': 2.0,
};

const CONFIG_STEPS = ['Matérias', 'Afinidade', 'Prioridades', 'Disponibilidade'];

export function PlanConfigWizard({ open, onClose, journeyId, areas, configuration, onSave }: {
  open: boolean;
  onClose(): void;
  journeyId: number;
  areas: KnowledgeAreaResponse[];
  configuration?: StudyRoutineConfigurationRequest;
  onSave(configuration: StudyRoutineConfigurationRequest): Promise<void>;
}) {
  const [step, setStep] = useState<ConfigStep>(1);
  const [enabled, setEnabled] = useState<Set<number>>(() => new Set(areas.map(a => a.id)));
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
  const [affinity, setAffinity] = useState<Map<number, Affinity>>(
    () => new Map(areas.map(a => [a.id, 'Neutra' as Affinity]))
  );
  const [availability, setAvailability] = useState<Record<Day, string>>(
    () => Object.fromEntries(DAYS.map(d => [d, ''])) as Record<Day, string>
  );
  const [hoursPerTopic, setHoursPerTopic] = useState('2');
  const [reviewIntervalDays, setReviewIntervalDays] = useState('7');
  const [studyPercentage, setStudyPercentage] = useState('50');
  const [reviewPercentage, setReviewPercentage] = useState('25');
  const [questionsPercentage, setQuestionsPercentage] = useState('25');
  const [areaHoursOverride, setAreaHoursOverride] = useState<Map<number, string>>(new Map());
  const [nodeHoursOverride, setNodeHoursOverride] = useState<Map<number, string>>(new Map());
  const [expandedLoadAreas, setExpandedLoadAreas] = useState<Set<number>>(new Set());
  const [flashcards, setFlashcards] = useState<FlashcardResponse[]>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    flashcardService.list(journeyId).then(items => active && setFlashcards(items)).catch(() => active && setFlashcards([]));
    return () => { active = false; };
  }, [open, journeyId]);

  useEffect(() => {
    if (!open || !configuration) return;
    setEnabled(new Set(configuration.knowledgeAreaIds));
    setAffinity(new Map(Object.entries(configuration.affinity).map(([id, value]) => [Number(id), value as Affinity])));
    setHoursPerTopic(String(configuration.hoursPerTopic));
    setReviewIntervalDays(String(configuration.reviewIntervalDays));
    setStudyPercentage(String(configuration.studyPercentage));
    setReviewPercentage(String(configuration.reviewPercentage));
    setQuestionsPercentage(String(configuration.questionsPercentage));
    setAvailability(Object.fromEntries(DAYS.map(day => [day, configuration.availability[day] ? String(configuration.availability[day]) : ''])) as Record<Day, string>);
    setAreaHoursOverride(new Map(Object.entries(configuration.areaHoursOverride).map(([id, value]) => [Number(id), String(value)])));
    setNodeHoursOverride(new Map(Object.entries(configuration.nodeHoursOverride).map(([id, value]) => [Number(id), String(value)])));
  }, [open, configuration]);


  if (!open) return null;

  const activeAreas = areas.filter(a => enabled.has(a.id));
  const parsedHours = Math.max(0.5, parseFloat(hoursPerTopic) || 2);

  const effectiveAreaHpt = (areaId: number) => {
    const ov = areaHoursOverride.get(areaId);
    return ov !== undefined ? Math.max(0.5, parseFloat(ov) || 0.5) : parsedHours;
  };
  const effectiveNodeHpt = (nodeId: number, areaId: number) => {
    const ov = nodeHoursOverride.get(nodeId);
    return ov !== undefined ? Math.max(0.5, parseFloat(ov) || 0.5) : effectiveAreaHpt(areaId);
  };
  const toggleLoadExpand = (areaId: number) => setExpandedLoadAreas(prev => {
    const n = new Set(prev); n.has(areaId) ? n.delete(areaId) : n.add(areaId); return n;
  });

  const weeklyHours = DAYS.reduce((sum, d) => sum + (parseFloat(availability[d]) || 0), 0);
  const totalPlanHours = activeAreas.reduce((sum, area) =>
    sum + area.nodes.reduce((s, node) => s + effectiveNodeHpt(node.id, area.id), 0), 0);
  const weeksNeeded = weeklyHours > 0 ? totalPlanHours / weeklyHours : null;

  const toggleArea = (id: number) => setEnabled(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleExpand = (id: number) => setExpandedAreas(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const goNext = () => {
    if (step < 4) setStep(s => (s + 1) as ConfigStep);
    else { const configuration: StudyRoutineConfigurationRequest = { knowledgeAreaIds: activeAreas.map(area => area.id), affinity: Object.fromEntries(affinity), hoursPerTopic: parsedHours, reviewIntervalDays: Math.max(1, parseInt(reviewIntervalDays) || 7), studyPercentage: Math.max(0, parseInt(studyPercentage) || 0), reviewPercentage: Math.max(0, parseInt(reviewPercentage) || 0), questionsPercentage: Math.max(0, parseInt(questionsPercentage) || 0), availability: Object.fromEntries(DAYS.map(day => [day, parseFloat(availability[day]) || 0])), areaHoursOverride: Object.fromEntries([...areaHoursOverride].map(([key, value]) => [key, parseFloat(value) || parsedHours])), nodeHoursOverride: Object.fromEntries([...nodeHoursOverride].map(([key, value]) => [key, parseFloat(value) || parsedHours])) }; if (configuration.studyPercentage + configuration.reviewPercentage + configuration.questionsPercentage !== 100) { toast.error('Os percentuais devem totalizar 100%.'); return; } onSave(configuration).then(() => { toast.success('Ciclo de estudos salvo!'); onClose(); }).catch(() => toast.error('Não foi possível salvar o ciclo de estudos.')); }
  };

  return (
    <div className="sp-wizard">
      {/* Top bar */}
      <div className="sp-wizard-top">
        <div>
          <span className="eyebrow">CONFIGURAR CICLO</span>
          <h1 className="sp-wizard-title">{CONFIG_STEPS[step - 1]}</h1>
        </div>
        <button className="sp-wizard-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Fechar
        </button>
      </div>

      {/* Stepper */}
      <div className="sp-wizard-stepper">
        {CONFIG_STEPS.map((label, i) => (
          <div key={label} className={`sp-wz-step${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
            <span>{step > i + 1 ? '✓' : i + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="sp-wizard-body">

        {step === 1 && (
          <div className="sp-wz-stage">
            <p className="sp-wz-desc">Selecione as matérias e expanda para escolher os tópicos e ver seus flashcards.</p>
            <div className="sp-wz-areas">
              {areas.map(area => {
                const on = enabled.has(area.id);
                const expanded = expandedAreas.has(area.id);
                return (
                  <div key={area.id} className={`sp-wz-area${on ? ' selected' : ''}`}>
                    {/* Area header row */}
                    <div className="sp-wz-area-row">
                      <label className="sp-wz-area-check">
                        <input type="checkbox" checked={on} onChange={() => toggleArea(area.id)} />
                      </label>
                      <div className="sp-wz-area-info" onClick={() => on && toggleExpand(area.id)}>
                        <strong>{area.title}</strong>
                        <small>{area.nodes.length} tópico{area.nodes.length !== 1 ? 's' : ''} · {flashcards.filter(card => card.knowledgeAreaId === area.id).length} flashcards</small>
                      </div>
                      {on && (
                        <button
                          className={`sp-wz-expand-btn${expanded ? ' expanded' : ''}`}
                          onClick={() => toggleExpand(area.id)}
                          aria-label={expanded ? 'Recolher' : 'Expandir'}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Expandable topic list */}
                    {on && expanded && (
                      <div className="sp-wz-topics">
                        {area.nodes.map(node => (
                          <div key={node.id} className="sp-wz-topic">
                            <span className="sp-wz-topic-title">{node.title}</span>
                            <span className="sp-wz-flash-badge">
                              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              {flashcards.filter(card => card.knowledgeAreaId === area.id && (card.syllabusNodeId === node.id || node.children.some(child => child.id === card.syllabusNodeId))).length} flashcards
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sp-wz-stage">
            <p className="sp-wz-desc">Matérias com menor afinidade recebem mais tempo no ciclo.</p>
            <div className="sp-drawer-affinity">
              {activeAreas.map(area => (
                <div key={area.id} className="sp-drawer-affinity-row">
                  <span>{area.title}</span>
                  <select
                    value={affinity.get(area.id) ?? 'Neutra'}
                    onChange={e => setAffinity(prev => new Map(prev).set(area.id, e.target.value as Affinity))}
                  >
                    <option>Muito alta</option>
                    <option>Alta</option>
                    <option>Neutra</option>
                    <option>Baixa</option>
                    <option>Muito baixa</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sp-wz-stage">
            <p className="sp-wz-desc">Baseado na sua afinidade, cada matéria recebe uma prioridade e uma frequência de revisão no ciclo — menor afinidade significa revisões mais frequentes.</p>
            <div className="sp-drawer-priorities">
              {activeAreas.map(area => {
                const aff = affinity.get(area.id) ?? 'Neutra';
                const { label, color } = AFFINITY_TO_PRIORITY[aff];
                const mult = AFFINITY_MULTIPLIER[aff];
                return (
                  <div key={area.id} className="sp-drawer-priority-row">
                    <strong>{area.title}</strong>
                    <div className="sp-prio-badges">
                      <span className="sp-prio-badge" style={{ background: `${color}18`, color }}>
                        PRIORIDADE {label.toUpperCase()}
                      </span>
                      <span className="sp-prio-mult">×{mult} revisão</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="sp-wz-stage">
            {/* Daily availability */}
            <p className="sp-wz-desc" style={{ marginTop: 0 }}>Disponibilidade semanal — deixe em branco os dias de folga.</p>
            <div className="sp-drawer-availability">
              {DAYS.map(day => (
                <label key={day} className="sp-drawer-day">
                  <span>{day}</span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="0"
                    value={availability[day]}
                    onChange={e => setAvailability(prev => ({ ...prev, [day]: e.target.value }))}
                  />
                  <small>h</small>
                </label>
              ))}
            </div>

            {/* Hours per topic */}
            <div className="sp-hours-config">
              <div className="sp-hours-config-label">
                <strong>Horas por tópico</strong>
                <small>Tempo de teoria. Clique na tabela para ajustar por matéria.</small>
              </div>
              <label className="sp-hours-input-wrap">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={hoursPerTopic}
                  onChange={e => setHoursPerTopic(e.target.value)}
                />
                <span>h por tópico</span>
              </label>
            </div>

            {/* Per-subject load table */}
            <div className="sp-area-load">
              <div className="sp-area-load-header">
                <span>Matéria</span>
                <span>Tópicos</span>
                <span>h/tópico</span>
                <span>Total teoria</span>
              </div>
              {activeAreas.map(area => {
                const areaOv = areaHoursOverride.has(area.id);
                const areaDisplay = areaOv ? (areaHoursOverride.get(area.id) ?? '') : String(parsedHours);
                const areaTotal = Math.round(area.nodes.reduce((s, n) => s + effectiveNodeHpt(n.id, area.id), 0) * 10) / 10;
                const expanded = expandedLoadAreas.has(area.id);
                return (
                  <div key={area.id}>
                    {/* Area row */}
                    <div className={`sp-area-load-row sp-area-load-row--area${expanded ? ' expanded' : ''}`}>
                      <span className="sp-area-load-name">
                        <button type="button" className={`sp-area-load-expand${expanded ? ' expanded' : ''}`} onClick={() => toggleLoadExpand(area.id)} aria-label={expanded ? 'Recolher' : 'Expandir tópicos'}>
                          <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        {area.title}
                      </span>
                      <span>{area.nodes.length}</span>
                      <span className="sp-area-load-hpt">
                        <input
                          type="number"
                          className={`sp-area-load-hpt-input${areaOv ? ' overridden' : ''}`}
                          min="0.5" max="20" step="0.5"
                          value={areaDisplay}
                          title="h/tópico padrão para esta matéria"
                          onChange={e => setAreaHoursOverride(prev => new Map(prev).set(area.id, e.target.value))}
                          onFocus={e => { if (!areaOv) { setAreaHoursOverride(prev => new Map(prev).set(area.id, areaDisplay)); e.target.select(); } }}
                        />
                        <span>h</span>
                        {areaOv && <button type="button" className="sp-area-load-reset" title="Restaurar padrão global" onClick={() => setAreaHoursOverride(prev => { const n = new Map(prev); n.delete(area.id); return n; })}>↺</button>}
                      </span>
                      <span className="sp-area-load-total">{areaTotal}h</span>
                    </div>

                    {/* Topic sub-rows */}
                    {expanded && area.nodes.map(node => {
                      const nodeOv = nodeHoursOverride.has(node.id);
                      const nodeDisplay = nodeOv ? (nodeHoursOverride.get(node.id) ?? '') : String(effectiveAreaHpt(area.id));
                      return (
                        <div key={node.id} className="sp-area-load-row sp-area-load-row--node">
                          <span className="sp-area-load-name sp-area-load-node-name">{node.title}</span>
                          <span />
                          <span className="sp-area-load-hpt">
                            <input
                              type="number"
                              className={`sp-area-load-hpt-input${nodeOv ? ' overridden' : ''}`}
                              min="0.5" max="20" step="0.5"
                              value={nodeDisplay}
                              title="h para este tópico"
                              onChange={e => setNodeHoursOverride(prev => new Map(prev).set(node.id, e.target.value))}
                              onFocus={e => { if (!nodeOv) { setNodeHoursOverride(prev => new Map(prev).set(node.id, nodeDisplay)); e.target.select(); } }}
                            />
                            <span>h</span>
                            {nodeOv && <button type="button" className="sp-area-load-reset" title="Restaurar padrão da matéria" onClick={() => setNodeHoursOverride(prev => { const n = new Map(prev); n.delete(node.id); return n; })}>↺</button>}
                          </span>
                          <span className="sp-area-load-total">{effectiveNodeHpt(node.id, area.id)}h</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="sp-metric-fields">
              <div className="sp-metric-field">
                <span className="sp-metric-label">Intervalo de revisão</span>
                <div className="sp-metric-input-wrap">
                  <input type="number" min="1" value={reviewIntervalDays} onChange={e => setReviewIntervalDays(e.target.value)} />
                  <span className="sp-metric-unit">dias</span>
                </div>
              </div>
              <div className="sp-metric-field">
                <span className="sp-metric-label">Estudo</span>
                <div className="sp-metric-input-wrap">
                  <input type="number" min="0" max="100" value={studyPercentage} onChange={e => setStudyPercentage(e.target.value)} />
                  <span className="sp-metric-unit">%</span>
                </div>
              </div>
              <div className="sp-metric-field">
                <span className="sp-metric-label">Revisão</span>
                <div className="sp-metric-input-wrap">
                  <input type="number" min="0" max="100" value={reviewPercentage} onChange={e => setReviewPercentage(e.target.value)} />
                  <span className="sp-metric-unit">%</span>
                </div>
              </div>
              <div className="sp-metric-field">
                <span className="sp-metric-label">Questões</span>
                <div className="sp-metric-input-wrap">
                  <input type="number" min="0" max="100" value={questionsPercentage} onChange={e => setQuestionsPercentage(e.target.value)} />
                  <span className="sp-metric-unit">%</span>
                </div>
              </div>
            </div>

            {/* Plan summary */}
            {totalPlanHours > 0 && (
              <div className="sp-plan-summary">
                <div className="sp-plan-summary-stat">
                  <strong>{Math.round(totalPlanHours)}h</strong>
                  <small>de teoria no total</small>
                </div>
                <div className="sp-plan-summary-divider" />
                <div className="sp-plan-summary-stat">
                  <strong>{activeAreas.reduce((s, a) => s + a.nodes.length, 0)}</strong>
                  <small>tópicos no ciclo</small>
                </div>
                {weeksNeeded !== null && (
                  <>
                    <div className="sp-plan-summary-divider" />
                    <div className="sp-plan-summary-stat">
                      <strong>{Math.ceil(weeksNeeded)} sem.</strong>
                      <small>com {weeklyHours}h/semana</small>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="sp-wizard-footer">
        {step > 1 && (
          <button className="sp-wz-back" onClick={() => setStep(s => (s - 1) as ConfigStep)}>Voltar</button>
        )}
        <button className="sp-wz-next" onClick={goNext}>
          {step === 4 ? 'Gerar Ciclo de Estudos' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Pomodoro Panel (floating, draggable, clock-shaped)
   ════════════════════════════════════════════ */
type PomodoroMode = 'livre' | 'pomodoro';
type PomodoroPhase = 'foco' | 'pausa' | 'longa';
interface PomodoroConfig { focoMin: number; pausaMin: number; longaMin: number; ciclos: number }
const POMO_DEFAULT: PomodoroConfig = { focoMin: 25, pausaMin: 5, longaMin: 15, ciclos: 4 };

export function PomodoroPanel({
  open, onClose, areas = [],
  initialAreaId, initialTopicId, initialSubtopicId, onRunningChange, expandSignal,
}: {
  open: boolean;
  onClose(): void;
  areas?: KnowledgeAreaResponse[];
  initialAreaId?: number;
  initialTopicId?: number;
  initialSubtopicId?: number;
  onRunningChange?(running: boolean): void;
  expandSignal?: number;
}) {
  // ── Timer state ──
  const [mode, setMode] = useState<PomodoroMode>('livre');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState<PomodoroPhase>('foco');
  const [ciclo, setCiclo] = useState(1);
  const [config, setConfig] = useState<PomodoroConfig>(POMO_DEFAULT);
  const [minimized, setMinimized] = useState(false);
  const [phaseAlert, setPhaseAlert] = useState(false);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const enableAlarmAudio = () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === 'suspended') void audioContextRef.current.resume();
  };
  useEffect(() => () => { void audioContextRef.current?.close(); audioContextRef.current = null; }, []);
  useEffect(() => { onRunningChange?.(running); }, [running, onRunningChange]);
  useEffect(() => { if (expandSignal) setMinimized(false); }, [expandSignal]);

  // ── Context selectors ──
  const [selAreaId, setSelAreaId] = useState<number | null>(initialAreaId ?? null);
  const [selTopicId, setSelTopicId] = useState<number | null>(initialTopicId ?? null);
  const [selSubId, setSelSubId] = useState<number | null>(initialSubtopicId ?? null);

  useEffect(() => {
    if (open) {
      setSelAreaId(initialAreaId ?? null);
      setSelTopicId(initialTopicId ?? null);
      setSelSubId(initialSubtopicId ?? null);
    }
  }, [open, initialAreaId, initialTopicId, initialSubtopicId]);

  const selArea  = areas.find(a => a.id === selAreaId) ?? null;
  const selTopic = selArea?.nodes.find(n => n.id === selTopicId) ?? null;
  const subs     = selTopic?.children ?? [];

  // ── Drag (works on the entire panel) ──
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const clampPosition = (x: number, y: number) => {
    const padding = 8;
    const width = panelRef.current?.offsetWidth ?? (minimized ? 72 : 240);
    const height = panelRef.current?.offsetHeight ?? (minimized ? 72 : 480);
    return {
      x: Math.min(Math.max(padding, x), Math.max(padding, window.innerWidth - width - padding)),
      y: Math.min(Math.max(padding, y), Math.max(padding, window.innerHeight - height - padding)),
    };
  };
  useEffect(() => {
    if (open && pos === null) setPos(clampPosition(window.innerWidth - 260, 80));
  }, [open]);
  useEffect(() => {
    const keepInsideViewport = () => setPos(current => current ? clampPosition(current.x, current.y) : current);
    keepInsideViewport();
    window.addEventListener('resize', keepInsideViewport);
    return () => window.removeEventListener('resize', keepInsideViewport);
  }, [minimized]);
  useEffect(() => {
    if (!phaseAlert) return;
    setMinimized(false);
    window.requestAnimationFrame(() => {
      const width = panelRef.current?.offsetWidth ?? 240;
      const height = panelRef.current?.offsetHeight ?? 480;
      setPos(clampPosition((window.innerWidth - width) / 2, (window.innerHeight - height) / 2));
    });
  }, [phaseAlert]);
  useEffect(() => {
    if (!phaseAlert || alarmMuted) return;
    const context = audioContextRef.current;
    if (!context) return;
    const play = () => {
      const startAt = context.currentTime;
      [0, .32, .64].forEach(offset => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(880, startAt + offset);
        gain.gain.setValueAtTime(0.0001, startAt + offset);
        gain.gain.exponentialRampToValueAtTime(.22, startAt + offset + .025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + .22);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(startAt + offset); oscillator.stop(startAt + offset + .24);
      });
    };
    let interval: number | undefined;
    let active = true;
    const startAlarm = () => { if (!active) return; play(); interval = window.setInterval(play, 1_250); };
    if (context.state === 'suspended') void context.resume().then(startAlarm).catch(() => {});
    else startAlarm();
    return () => { active = false; if (interval !== undefined) window.clearInterval(interval); };
  }, [phaseAlert, alarmMuted]);
  useEffect(() => {
    if (!open || minimized) return;
    const minimizeOnOutsideClick = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest('[data-pomodoro-trigger]')) return;
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (phaseAlert) return;
        if (running) setMinimized(true);
        else onClose();
      }
    };
    document.addEventListener('pointerdown', minimizeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', minimizeOnOutsideClick);
  }, [open, minimized, running, phaseAlert, onClose]);
  const drag = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });
  const onDragDown = (e: React.PointerEvent<HTMLElement>) => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: pos?.x ?? 0, oy: pos?.y ?? 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    setPos(clampPosition(drag.current.ox + e.clientX - drag.current.startX, drag.current.oy + e.clientY - drag.current.startY));
  };
  const onDragUp = () => { drag.current.active = false; };

  // ── Timer logic ──
  const stateRef = useRef({ mode, phase, ciclo, config });
  useEffect(() => { stateRef.current = { mode, phase, ciclo, config }; });

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const { mode: m, phase: p, ciclo: c, config: cfg } = stateRef.current;
    if (m !== 'pomodoro') return;
    const total = (p === 'foco' ? cfg.focoMin : p === 'pausa' ? cfg.pausaMin : cfg.longaMin) * 60;
    if (total > 0 && seconds >= total) {
      setRunning(false); setSeconds(0);
      if (p === 'foco') { setPhase(c % cfg.ciclos === 0 ? 'longa' : 'pausa'); setCiclo(prev => prev >= cfg.ciclos ? 1 : prev + 1); }
      else setPhase('foco');
      setPhaseAlert(true);
    }
  }, [seconds]);

  if (!open || pos === null) return null;

  const phaseTotal = mode === 'pomodoro'
    ? (phase === 'foco' ? config.focoMin : phase === 'pausa' ? config.pausaMin : config.longaMin) * 60 : 0;
  const display = mode === 'livre' ? seconds : Math.max(0, phaseTotal - seconds);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const stop  = () => { setPhaseAlert(false); setRunning(false); setSeconds(0); setPhase('foco'); setCiclo(1); };
  const reset = () => { setPhaseAlert(false); setRunning(false); setSeconds(0); };
  const skip  = () => { reset(); if (phase === 'foco') { setPhase(ciclo % config.ciclos === 0 ? 'longa' : 'pausa'); setCiclo(c => c >= config.ciclos ? 1 : c + 1); } else setPhase('foco'); };
  const acknowledgePhase = () => { setPhaseAlert(false); setRunning(true); };
  const switchMode = (m: PomodoroMode) => { stop(); setMode(m); };

  // ── Ring math ──
  const R = 82, CIRC = 2 * Math.PI * R;
  const fill = mode === 'livre' ? Math.min(seconds / 5400, 1) : phaseTotal > 0 ? seconds / phaseTotal : 0;
  const dashOffset = CIRC * (1 - fill);
  const COLOR: Record<PomodoroPhase, string> = { foco: '#9472c8', pausa: '#22907a', longa: '#e8831a' };
  const ringColor = mode === 'livre' ? '#9472c8' : COLOR[phase];
  const statusLabel = mode === 'livre'
    ? (running ? 'estudando' : seconds > 0 ? 'pausado' : 'pronto')
    : ({ foco: 'foco', pausa: 'pausa curta', longa: 'pausa longa' }[phase]);

  // ── Minimized: tiny floating clock ──
  if (minimized) {
    const miniR = 31, miniCirc = 2 * Math.PI * miniR;
    return (
      <div
        ref={panelRef}
        className="pm-mini"
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onDragDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
        onPointerCancel={onDragUp}
        onClick={event => { event.stopPropagation(); setMinimized(false); }}
      >
        <svg viewBox="0 0 72 72" className="pm-mini-ring" aria-hidden>
          <circle cx="36" cy="36" r={miniR} fill="none" stroke="#ede7f6" strokeWidth="5"/>
          <circle cx="36" cy="36" r={miniR} fill="none"
            stroke={ringColor} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={miniCirc} strokeDashoffset={miniCirc * (1 - fill)}
            transform="rotate(-90 36 36)"
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>
        <time className="pm-mini-time" style={{ color: ringColor }}>{fmt(display)}</time>
        <span className="pm-mini-status" style={{ color: ringColor }}>{running ? '▶' : '⏸'}</span>
        <button
          className="pm-mini-expand"
          aria-label="Expandir"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setMinimized(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  // ── Full clock panel ──
  return (
    <div
      ref={panelRef}
      className={`pm-panel${phaseAlert ? ' pm-panel--alert' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onDragDown}
      onPointerMove={onDragMove}
      onPointerUp={onDragUp}
      onPointerCancel={onDragUp}
    >

      {/* ── Clock face (circular section) ── */}
      <div className="pm-face">

        {/* Top overlay: mode switch | minimize + close */}
        <div className="pm-disc-top" onPointerDown={e => e.stopPropagation()}>
          <div className="pm-mode-switch">
            <button className={mode === 'livre' ? 'active' : ''} onClick={() => switchMode('livre')} title="Cronômetro livre" aria-label="Livre">
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button className={mode === 'pomodoro' ? 'active' : ''} onClick={() => switchMode('pomodoro')} title="Modo pomodoro" aria-label="Pomodoro">
              <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>🍅</span>
            </button>
          </div>
          <div className="pm-disc-actions">
            <button className={`pm-sound${alarmMuted ? ' muted' : ''}`} onClick={() => { enableAlarmAudio(); setAlarmMuted(value => !value); }} aria-label={alarmMuted ? 'Ativar som do alarme' : 'Silenciar alarme'} title={alarmMuted ? 'Ativar som' : 'Silenciar alarme'}>
              <span aria-hidden>{alarmMuted ? '🔕' : '🔔'}</span>
            </button>
            <button className="pm-minimize" onClick={() => setMinimized(true)} aria-label="Minimizar">
              <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden>
                <path d="M8 3v5H3M21 3l-7 7M16 21v-5h5M3 21l7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="pm-close" onClick={onClose} aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Ring SVG — 60 tick marks like a real clock face */}
        <svg viewBox="0 0 200 200" className="pm-ring" aria-hidden>
          {Array.from({ length: 60 }, (_, i) => {
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const r1 = 93, r2 = i % 5 === 0 ? 83 : 90;
            return <line key={i}
              x1={100 + r1 * Math.cos(angle)} y1={100 + r1 * Math.sin(angle)}
              x2={100 + r2 * Math.cos(angle)} y2={100 + r2 * Math.sin(angle)}
              stroke={i % 5 === 0 ? '#c8b8e0' : '#e8e0f0'}
              strokeWidth={i % 5 === 0 ? 2.5 : 1}
              strokeLinecap="round"
            />;
          })}
          <circle cx="100" cy="100" r={R} fill="none" stroke="#ede7f6" strokeWidth="10"/>
          <circle cx="100" cy="100" r={R} fill="none"
            stroke={ringColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>

        {/* Center: time + status */}
        <div className="pm-face-inner">
          <time className="pm-time">{fmt(display)}</time>
          <span className="pm-status" style={{ color: ringColor }}>{statusLabel}</span>
        </div>

        {/* Controls overlaid at bottom of clock face */}
        <div className="pm-controls" onPointerDown={e => e.stopPropagation()}>
          <button className="pm-ctrl pm-ctrl--ghost" onClick={stop} title="Parar">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden><rect x="4" y="4" width="16" height="16" rx="3"/></svg>
          </button>
          <button className={`pm-ctrl pm-ctrl--primary${running ? ' pause' : ''}`} onClick={() => { enableAlarmAudio(); phaseAlert ? acknowledgePhase() : setRunning(r => !r); }} title={phaseAlert ? 'Confirmar e iniciar próxima fase' : running ? 'Pausar' : 'Iniciar'}>
            {running
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden><rect x="6" y="4" width="4" height="16" rx="2"/><rect x="14" y="4" width="4" height="16" rx="2"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden><polygon points="6,3 20,12 6,21"/></svg>
            }
          </button>
          {mode === 'pomodoro' ? (
            <button className="pm-ctrl pm-ctrl--ghost" onClick={skip} title="Pular fase">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden>
                <polygon points="5,4 14,12 5,20"/><rect x="15" y="4" width="4" height="16" rx="1.5"/>
              </svg>
            </button>
          ) : (
            <button className="pm-ctrl pm-ctrl--ghost" onClick={reset} title="Zerar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden>
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
            </button>
          )}
        </div>
        {phaseAlert && <button className="pm-phase-alert" onPointerDown={event => event.stopPropagation()} onClick={acknowledgePhase}><span>Tempo encerrado</span><strong>OK · iniciar {phase === 'foco' ? 'foco' : phase === 'pausa' ? 'pausa' : 'pausa longa'}</strong></button>}

      </div>{/* end pm-face */}

      {/* ── Pomodoro config tray ── */}
      {mode === 'pomodoro' && (
        <div className="pm-pomo-cfg" onPointerDown={e => e.stopPropagation()}>
          <div className="pm-time-blocks">
            {([
              { p: 'foco'  as PomodoroPhase, label: 'Foco',  key: 'focoMin'  as keyof PomodoroConfig, max: 120 },
              { p: 'pausa' as PomodoroPhase, label: 'Pausa', key: 'pausaMin' as keyof PomodoroConfig, max: 60  },
              { p: 'longa' as PomodoroPhase, label: 'Longa', key: 'longaMin' as keyof PomodoroConfig, max: 60  },
            ]).map(({ p, label, key, max }) => (
              <button key={p} type="button"
                className={`pm-tb pm-tb--${p}${phase === p ? ' active' : ''}`}
                onClick={() => { reset(); setPhase(p); }}
              >
                <input type="number" min="1" max={max}
                  value={config[key]}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { stop(); setPhase(p); setConfig(c => ({ ...c, [key]: Math.max(1, +e.target.value) })); }}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="pm-cycles-row">
            <div className="pm-dots">
              {Array.from({ length: Math.min(config.ciclos, 8) }, (_, i) => (
                <span key={i} className={`pm-dot${i < ciclo - 1 ? ' done' : i === ciclo - 1 && phase === 'foco' ? ' active' : ''}`} />
              ))}
            </div>
            <label className="pm-ciclos-ctrl">
              <span>ciclo {ciclo}/</span>
              <input type="number" min="1" max="10" value={config.ciclos}
                onChange={e => { stop(); setConfig(c => ({ ...c, ciclos: Math.max(1, +e.target.value) })); }}
              />
            </label>
          </div>
          <div className="pm-elapsed">
            <span>{fmt(seconds)} decorrido</span>
            <span className="pm-elapsed-sep"/>
            <span>{fmt(display)} restante</span>
          </div>
        </div>
      )}

      {/* ── Association selectors ── */}
      {areas.length > 0 && (
        <div className="pm-assoc" onPointerDown={e => e.stopPropagation()}>
          <select className="pm-sel" value={selAreaId ?? ''}
            onChange={e => { setSelAreaId(e.target.value ? +e.target.value : null); setSelTopicId(null); setSelSubId(null); }}>
            <option value="">Matéria</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          {selArea && (
            <select className="pm-sel" value={selTopicId ?? ''}
              onChange={e => { setSelTopicId(e.target.value ? +e.target.value : null); setSelSubId(null); }}>
              <option value="">Tópico</option>
              {selArea.nodes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          )}
          {subs.length > 0 && (
            <select className="pm-sel" value={selSubId ?? ''}
              onChange={e => setSelSubId(e.target.value ? +e.target.value : null)}>
              <option value="">Subtópico</option>
              {subs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          )}
        </div>
      )}

    </div>
  );
}

/* ════════════════════════════════════════════
   Study Topic Dialog (lateral drawer)
   ════════════════════════════════════════════ */
export type StudyTopicTarget = { area: KnowledgeAreaResponse; topic: SyllabusNodeResponse };

type TopicProps = {
  target: StudyTopicTarget | null;
  completed: boolean;
  onClose(): void;
  onToggleComplete(): void;
  nodeStudy: SyllabusNodeStudyResponse[];
  onSaveNodeStudy(request: SyllabusNodeStudyRequest): Promise<SyllabusNodeStudyResponse>;
  onViewSubject(): void;
  onStartPomodoro(subtopicId?: number): void;
  journeyId: number;
  onListResources(nodeId: number): Promise<StudyResource[]>;
  onSaveResource(resource: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDeleteResource(id: number): Promise<void>;
};

function SubtopicItem({ child, topicTitle, journeyId, areaId, studyState, onStartPomodoro, onListResources, onSaveResource, onDeleteResource, onSaveStudy }: {
  child: SyllabusNodeResponse; topicTitle: string; journeyId: number; areaId: number;
  studyState?: SyllabusNodeStudyResponse;
  onStartPomodoro(subtopicId?: number): void;
  onListResources(nodeId: number): Promise<StudyResource[]>;
  onSaveResource(resource: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDeleteResource(id: number): Promise<void>;
  onSaveStudy(request: SyllabusNodeStudyRequest): Promise<SyllabusNodeStudyResponse>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'flashcards' | null>(null);
  const [revision, setRevision] = useState(Boolean(studyState?.reviewDate));
  const [reviewOpen, setReviewOpen] = useState(false);
  const [studiedMinutes, setStudiedMinutes] = useState(() =>
    isStudyCompleted(studyState?.progress ?? child.progress) ? (studyState?.studiedMinutes ?? 0) : 0
  );
  const [savingStudy, setSavingStudy] = useState(false);
  const progress = studyProgressPercent(studyState?.progress ?? child.progress);
  const pending = isStudyPending(studyState?.progress ?? child.progress);
  const titlePrefix = `${topicTitle.trim()} >`;
  const displayTitle = child.title.trim().toLocaleLowerCase().startsWith(titlePrefix.toLocaleLowerCase())
    ? child.title.trim().slice(titlePrefix.length).trim()
    : child.title;
  const [isCompleted, setIsCompleted] = useState(() => isStudyCompleted(studyState?.progress ?? child.progress));
  useEffect(() => {
    if (savingStudy) return;
    setIsCompleted(isStudyCompleted(studyState?.progress ?? child.progress));
    setRevision(Boolean(studyState?.reviewDate));
    setStudiedMinutes(isStudyCompleted(studyState?.progress ?? child.progress) ? (studyState?.studiedMinutes ?? 0) : 0);
  }, [studyState?.progress, studyState?.reviewDate, studyState?.studiedMinutes, child.progress, savingStudy]);

  async function saveStudy(completed: boolean, minutes: number, scheduleReview: boolean, reviewDate: string | null, clearPending = false) {
    setSavingStudy(true);
    try {
      const result = await onSaveStudy({ journeyId, syllabusNodeId: child.id, completed, studiedMinutes: minutes, scheduleReview, reviewDate, clearPending });
      setIsCompleted(isStudyCompleted(result.progress));
      setRevision(Boolean(result.reviewDate));
      setStudiedMinutes(completed ? result.studiedMinutes : 0);
      if (!completed) toast.success('Subtópico marcado como pendente.');
      else if (scheduleReview) toast.success('Subtópico concluído e revisão agendada.');
      else toast.success('Subtópico concluído com sucesso!');
    } catch { toast.error('Não foi possível salvar o estudo do subtópico.'); }
    finally { setSavingStudy(false); }
  }
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceKind, setResourceKind] = useState<StudyResourceKind>(99);
  const [urlLabel, setUrlLabel] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlSaving, setUrlSaving] = useState(false);
  const [viewerResource, setViewerResource] = useState<StudyResource | null>(null);

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    setResourcesLoading(true);
    onListResources(child.id).then(data => active && setResources(data)).catch(() => {}).finally(() => active && setResourcesLoading(false));
    return () => { active = false; };
  }, [expanded, child.id]);

  async function saveUrl() {
    const url = urlInput.trim(); if (!url) return;
    setUrlSaving(true);
    try {
      const saved = await onSaveResource({ journeyId, syllabusNodeId: child.id, kind: resourceKind, title: urlLabel.trim() || url, url });
      setResources(prev => [...prev, saved]);
      setUrlInput(''); setUrlLabel('');
      toast.success('Material salvo.');
    } catch { toast.error('Não foi possível salvar.'); }
    finally { setUrlSaving(false); }
  }

  const unavailable = (feature: string) => toast.info(`${feature} será conectado ao backend.`);

  return (
    <div className={`sp-subtopic-item${expanded ? ' sp-subtopic-item--expanded' : ''}`}>
      <div className="sp-subtopic-header">
        <button className={`sp-subtopic-check${isCompleted ? ' sp-subtopic-check--done' : ''}`} type="button" title={isCompleted ? 'Marcar pendente' : 'Concluir subtópico'} onClick={() => isCompleted ? void saveStudy(false, 0, false, null) : setReviewOpen(true)} disabled={savingStudy}>
          {isCompleted
            ? <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/></svg>
          }
        </button>
        <button className="sp-subtopic-expand" type="button" onClick={() => setExpanded(v => !v)}>
          <strong>{displayTitle}</strong><small>{isCompleted ? progress : 0}% · {isCompleted ? studiedMinutes : 0} min</small>
          <span className="sp-subtopic-arrow">{expanded ? '▾' : '▸'}</span>
        </button>
      </div>
      {expanded && (
        <div className="sp-subtopic-body">
          <div className="sp-topic-actions sp-topic-actions--sub">
            <button data-pomodoro-trigger onClick={() => onStartPomodoro(child.id)}>
              <span>◷</span><strong>Iniciar estudo</strong><small>Cronômetro e sessão</small>
            </button>
            <button onClick={() => unavailable('O registro de questões')}>
              <span>✓</span><strong>Registrar questões</strong><small>Acertos e erros</small>
            </button>
            <button className={activeTab === 'materials' ? 'active' : ''} onClick={() => setActiveTab(v => v === 'materials' ? null : 'materials')}>
              <span>▤</span><strong>Materiais</strong><small>PDFs, vídeos e links</small>
            </button>
            <button className={activeTab === 'flashcards' ? 'active' : ''} onClick={() => setActiveTab(v => v === 'flashcards' ? null : 'flashcards')}>
              <span className="flashcard-stack-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span><strong>Flashcard</strong><small>Memorização ativa</small>
            </button>
            <button className={revision ? 'active' : ''} onClick={() => setReviewOpen(true)} disabled={savingStudy}>
              <span className="sp-revision-icon">
                <svg viewBox="0 0 22 14" fill="none" aria-hidden="true">
                  <path d="M1 5l5 5L14 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9l5 5L21 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity={revision ? '1' : '0.35'}/>
                </svg>
              </span>
              <strong>{revision ? 'Revisão agendada' : 'Agendar revisão'}</strong><small>Revisão espaçada</small>
            </button>
          </div>
          {activeTab === 'materials' && (
            <section className="sp-topic-resource">
              <header>
                <div><span className="sp-dialog-label">Material do subtópico</span><strong>PDF, vídeo ou link de estudo</strong></div>
              </header>
              {resourcesLoading ? <p className="sp-dialog-empty">Carregando materiais…</p> : <>
                <div className="sp-material-url-form">
                  <div className="sp-material-type-row">
                    {([{ value: 1, label: 'PDF' }, { value: 2, label: 'Vídeo' }, { value: 3, label: 'Apostila' }, { value: 5, label: 'Site' }, { value: 99, label: 'Outro' }] as const).map(item => (
                      <button key={item.value} type="button" className={`sp-material-type-pill${resourceKind === item.value ? ' active' : ''}`} onClick={() => setResourceKind(item.value)}>{item.label}</button>
                    ))}
                  </div>
                  <input className="sp-material-label-input" type="text" placeholder="Descrição (ex: Apostila do QConcursos, Cap. 3)" value={urlLabel} onChange={e => setUrlLabel(e.target.value)} />
                  <input className="sp-material-url-input" type="url" placeholder="https://..." value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !urlSaving && void saveUrl()} />
                  <button className="sp-material-save-btn" type="button" disabled={urlSaving || !urlInput.trim()} onClick={() => void saveUrl()}>{urlSaving ? '…' : 'Salvar'}</button>
                </div>
                {resources.length > 0 && (
                  <div className="sp-material-list">
                    {resources.map(resource => <div key={resource.id}>
                      <span>{resource.kind === 1 ? 'PDF' : resource.kind === 2 ? 'Vídeo' : resource.kind === 3 ? 'Apostila' : resource.kind === 5 ? 'Site' : 'Outro'}</span>
                      <button className="sp-resource-open" type="button" onClick={() => setViewerResource(resource)}>
                        <strong>{resource.title}</strong><small>{resource.url}</small>
                      </button>
                      <button className="sp-resource-delete" type="button" onClick={() => void onDeleteResource(resource.id).then(() => { setResources(c => c.filter(i => i.id !== resource.id)); if (viewerResource?.id === resource.id) setViewerResource(null); toast.success('Material removido.'); })} aria-label="Remover material">×</button>
                    </div>)}
                  </div>
                )}
              </>}
              {viewerResource && <ContentViewer url={viewerResource.url} title={viewerResource.title} onClose={() => setViewerResource(null)} />}
            </section>
          )}
          {activeTab === 'flashcards' && (
            <section className="sp-topic-resource">
              <header><div><span className="sp-dialog-label">Flashcards</span><strong>Revisão rápida</strong></div></header>
              <FlashcardManager journeyId={journeyId} areaId={areaId} nodeId={child.id} />
            </section>
          )}
        </div>
      )}
      {reviewOpen && <ReviewDialog title={child.title} defaultMinutes={Math.max(1, studiedMinutes || 60)} pending={pending} onClearPending={() => { void saveStudy(false, 0, false, null, true); setReviewOpen(false); }} onClose={() => setReviewOpen(false)} onConfirm={(schedule, date, minutes, completed) => { void saveStudy(completed, minutes, completed && schedule, completed && schedule ? date : null); setReviewOpen(false); }} />}
    </div>
  );
}

export function StudyTopicDialog({ target, completed, onClose, onToggleComplete, nodeStudy, onSaveNodeStudy, onViewSubject, onStartPomodoro, journeyId, onListResources, onSaveResource, onDeleteResource }: TopicProps) {
  const [revision, setRevision] = useState(false);
  const [activeResource, setActiveResource] = useState<'materials' | 'flashcards' | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [resourceKind, setResourceKind] = useState<StudyResourceKind>(99);
  const [urlLabel, setUrlLabel] = useState('');
  const [urlSaving, setUrlSaving] = useState(false);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [viewerResource, setViewerResource] = useState<StudyResource | null>(null);

  useEffect(() => {
    if (!target) return;
    let active = true;
    setResources([]);
    setUrlInput('');
    setUrlLabel('');
    setViewerResource(null);
    setResourcesLoading(true);
    onListResources(target.topic.id)
      .then(items => active && setResources(items))
      .catch(() => active && toast.error('Não foi possível carregar os materiais.'))
      .finally(() => active && setResourcesLoading(false));
    return () => { active = false; };
  }, [target?.topic.id]);

  if (!target) return null;
  const unavailable = (feature: string) => toast.info(`${feature} será conectado ao backend.`);

  async function saveUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setUrlSaving(true);
    try {
      const saved = await onSaveResource({ title: urlLabel.trim() || target!.topic.title, url: trimmed, kind: resourceKind, journeyId, knowledgeAreaId: target!.area.id, syllabusNodeId: target!.topic.id });
      setResources(current => [saved, ...current]);
      setViewerResource(saved);
      setUrlInput('');
      setUrlLabel('');
      toast.success('Material salvo.');
    } catch {
      toast.error('Não foi possível salvar.');
    } finally { setUrlSaving(false); }
  }

  const subtopics = target.topic.children;
  const targetStudy = nodeStudy.find(item => item.syllabusNodeId === target.topic.id);
  const completedSubtopics = subtopics.filter(child =>
    isStudyCompleted(nodeStudy.find(item => item.syllabusNodeId === child.id)?.progress ?? child.progress)
  ).length;
  const progress = subtopics.length
    ? Math.round(completedSubtopics / subtopics.length * 100)
    : studyProgressPercent(targetStudy?.progress ?? target.topic.progress);

  return (
    <div className="sp-topic-overlay" onMouseDown={onClose}>
      <aside className="sp-topic-panel" onMouseDown={e => e.stopPropagation()}>

        <header className="sp-topic-panel-header">
          <div className="sp-topic-drawer-title">
            <span className="eyebrow">{target.area.title}</span>
            <h1>{target.topic.title}</h1>
          </div>
          <button className="sp-wizard-close" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Fechar
          </button>
        </header>

        <div className="sp-topic-panel-body">
          <div className="sp-topic-dialog">
            <div className="sp-topic-status">
              <div><small>STATUS</small><strong>{completed ? 'Concluído' : 'Pendente'}</strong></div>
              <div><small>PROGRESSO</small><strong>{progress}%</strong></div>
              <div><small>SUBTÓPICOS</small><strong>{subtopics.length}</strong></div>
            </div>
            <span className="sp-dialog-label">Ações do tópico</span>
            <div className="sp-topic-actions">
              <button data-pomodoro-trigger onClick={() => onStartPomodoro()}>
                <span>◷</span><strong>Iniciar estudo</strong><small>Cronômetro e sessão</small>
              </button>
              <button onClick={() => unavailable('O registro de questões')}>
                <span>✓</span><strong>Registrar questões</strong><small>Acertos e erros</small>
              </button>
              <button className={activeResource === 'materials' ? 'active' : ''} onClick={() => setActiveResource(value => value === 'materials' ? null : 'materials')}>
                <span>▤</span><strong>Materiais</strong><small>PDFs, vídeos e links</small>
              </button>
              <button className={activeResource === 'flashcards' ? 'active' : ''} onClick={() => setActiveResource(value => value === 'flashcards' ? null : 'flashcards')}>
                <span className="flashcard-stack-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2h9a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h5M9 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span><strong>Flashcard</strong><small>Memorização ativa</small>
              </button>
              <button className={revision ? 'active' : ''} onClick={() => setRevision(v => !v)}>
                <span className="sp-revision-icon">
                  <svg viewBox="0 0 22 14" fill="none" aria-hidden="true">
                    <path d="M1 5l5 5L14 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 9l5 5L21 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity={revision ? '1' : '0.35'}/>
                  </svg>
                </span>
                <strong>{revision ? 'Revisão agendada' : 'Agendar revisão'}</strong><small>Revisão espaçada</small>
              </button>
            </div>
            {activeResource === 'materials' && (
              <section className="sp-topic-resource">
                <header>
                  <div><span className="sp-dialog-label">Material do tópico</span><strong>PDF, vídeo ou link de estudo</strong></div>
                </header>
                {resourcesLoading ? <p className="sp-dialog-empty">Carregando materiais…</p> : <>
                  <div className="sp-material-url-form">
                    <div className="sp-material-type-row">
                      {([{ value: 1, label: 'PDF' }, { value: 2, label: 'Vídeo' }, { value: 3, label: 'Apostila' }, { value: 5, label: 'Site' }, { value: 99, label: 'Outro' }] as const).map(item => (
                        <button
                          key={item.value}
                          type="button"
                          className={`sp-material-type-pill${resourceKind === item.value ? ' active' : ''}`}
                          onClick={() => setResourceKind(item.value)}
                        >{item.label}</button>
                      ))}
                    </div>
                    <input
                      className="sp-material-label-input"
                      type="text"
                      placeholder="Descrição (ex: Apostila do QConcursos, Cap. 3)"
                      value={urlLabel}
                      onChange={e => setUrlLabel(e.target.value)}
                    />
                    <input
                      className="sp-material-url-input"
                      type="url"
                      placeholder="https://..."
                      autoFocus
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !urlSaving && void saveUrl()}
                    />
                    <button className="sp-material-save-btn" type="button" disabled={urlSaving || !urlInput.trim()} onClick={() => void saveUrl()}>
                      {urlSaving ? '…' : 'Salvar'}
                    </button>
                  </div>
                  {resources.length > 0 && (
                    <div className="sp-material-list">
                      {resources.map(resource => <div key={resource.id}>
                        <span>{resource.kind === 1 ? 'PDF' : resource.kind === 2 ? 'Vídeo' : resource.kind === 3 ? 'Apostila' : resource.kind === 5 ? 'Site' : 'Outro'}</span>
                        <button className="sp-resource-open" type="button" onClick={() => setViewerResource(resource)}>
                          <strong>{resource.title}</strong><small>{resource.url}</small>
                        </button>
                        <button className="sp-resource-delete" type="button" onClick={() => void onDeleteResource(resource.id).then(() => { setResources(current => current.filter(item => item.id !== resource.id)); if (viewerResource?.id === resource.id) setViewerResource(null); toast.success('Material removido.'); })} aria-label="Remover material">×</button>
                      </div>)}
                    </div>
                  )}
                </>}
                {viewerResource && <ContentViewer url={viewerResource.url} title={viewerResource.title} onClose={() => setViewerResource(null)} />}
              </section>
            )}
            {activeResource === 'flashcards' && (
              <section className="sp-topic-resource">
                <header><div><span className="sp-dialog-label">Flashcards do tópico</span><strong>{target.topic.title}</strong></div></header>
                <FlashcardManager journeyId={journeyId} areaId={target.area.id} nodeId={target.topic.id} />
                <header className="sp-flashcard-subheading"><div><span className="sp-dialog-label">Flashcards da matéria</span><strong>{target.area.title}</strong></div></header>
                <FlashcardManager journeyId={journeyId} areaId={target.area.id} subjectOnly />
              </section>
            )}
            <span className="sp-dialog-label">Subtópicos</span>
            {subtopics.length > 0
              ? (
                <div className="sp-subtopic-list">
                  {subtopics.map(child => (
                    <SubtopicItem key={child.id} child={child} topicTitle={target.topic.title} journeyId={journeyId} areaId={target.area.id} studyState={nodeStudy.find(item => item.syllabusNodeId === child.id)} onStartPomodoro={onStartPomodoro} onListResources={onListResources} onSaveResource={onSaveResource} onDeleteResource={onDeleteResource} onSaveStudy={onSaveNodeStudy} />
                  ))}
                </div>
              )
              : <p className="sp-dialog-empty">Este tópico não possui subtópicos cadastrados.</p>
            }
          </div>
        </div>

        <footer className="sp-topic-panel-footer">
          <button onClick={onViewSubject}>Ver matéria completa</button>
          <button className={`sp-topic-complete-btn${completed ? ' sp-topic-complete-btn--done' : ''}`} onClick={() => { onToggleComplete(); }}>
            {completed ? '✓ Concluído' : 'Concluir tópico'}
          </button>
        </footer>

      </aside>
    </div>
  );
}
