import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { KnowledgeAreaResponse, SyllabusNodeResponse } from '../../../../@business/dto/response/journey.response';

/* ════════════════════════════════════════════
   Study Calendar
   ════════════════════════════════════════════ */
const PT_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PT_WD = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
const CAL_BG   = ['#ede7f9','#dde8fd','#d9f2ec','#fde7d9','#f2d9e7','#e7f2d9','#fdf5d9'];
const CAL_TEXT = ['#543c78','#2348a8','#1a6e54','#a85023','#a82348','#3a6e1a','#a87823'];

export function StudyCalendar({ areas }: { areas: KnowledgeAreaResponse[] }) {
  const now = new Date();
  const [view, setView] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const year  = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 0=Sun offset → Mon-based offset
  const rawFirst = new Date(year, month, 1).getDay();
  const offset = rawFirst === 0 ? 6 : rawFirst - 1;

  // Flatten all topic nodes with subject color index
  const items = areas.flatMap((area, ai) =>
    area.nodes.map(node => ({ node, areaTitle: area.title, colorIdx: ai % CAL_BG.length }))
  );

  // Build schedule: up to 4 topics per weekday, cycling through items
  const CAL_MAX_VISIBLE = 2;
  const schedule: Record<number, typeof items[0][]> = {};
  let idx = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay(); // 0=Sun
    if (dow === 0 || items.length === 0) continue;
    const slots = dow === 6 ? 2 : 4;
    schedule[d] = [];
    for (let s = 0; s < slots; s++) {
      schedule[d].push(items[idx % items.length]);
      idx++;
    }
  }

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = (d: number) => d === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  return (
    <section className="sp-card sp-calendar">
      <div className="sp-cal-head">
        <button className="sp-cal-nav" onClick={() => setView(new Date(year, month - 1, 1))}>‹</button>
        <h2>{PT_MONTHS[month]} {year}</h2>
        <button className="sp-cal-nav" onClick={() => setView(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="sp-cal-grid">
        {PT_WD.map(wd => <div key={wd} className="sp-cal-wd">{wd}</div>)}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`sp-cal-cell${!d ? ' sp-cal-cell--empty' : ''}${d && isToday(d) ? ' sp-cal-cell--today' : ''}`}
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
          </div>
        ))}
      </div>
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

const CONFIG_STEPS = ['Matérias', 'Afinidade', 'Prioridades', 'Disponibilidade'];

export function PlanConfigWizard({ open, onClose, areas }: {
  open: boolean;
  onClose(): void;
  areas: KnowledgeAreaResponse[];
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

  if (!open) return null;

  const activeAreas = areas.filter(a => enabled.has(a.id));

  const toggleArea = (id: number) => setEnabled(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleExpand = (id: number) => setExpandedAreas(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const goNext = () => {
    if (step < 4) setStep(s => (s + 1) as ConfigStep);
    else { toast.success('Ciclo de estudos gerado!'); onClose(); }
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
                        <small>{area.nodes.length} tópico{area.nodes.length !== 1 ? 's' : ''}</small>
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
                              0 flashcards
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
            <p className="sp-wz-desc">Baseado na sua afinidade, cada matéria recebe uma prioridade no ciclo.</p>
            <div className="sp-drawer-priorities">
              {activeAreas.map(area => {
                const aff = affinity.get(area.id) ?? 'Neutra';
                const { label, color } = AFFINITY_TO_PRIORITY[aff];
                return (
                  <div key={area.id} className="sp-drawer-priority-row">
                    <strong>{area.title}</strong>
                    <span className="sp-prio-badge" style={{ background: `${color}18`, color }}>
                      PRIORIDADE {label.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="sp-wz-stage">
            <p className="sp-wz-desc">Informe quantas horas você tem por dia. Deixe em branco os dias de folga.</p>
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
  onViewSubject(): void;
  onStartPomodoro(subtopicId?: number): void;
};

// Deterministic mock helpers (consistent per topic id)
function mockProgress(id: number) { return [18, 34, 52, 67, 81, 23, 45, 72][id % 8]; }
function mockQuestions(id: number) { return [12, 28, 45, 8, 63, 19, 37, 54][id % 8]; }
function mockAccuracy(id: number) { return [58, 72, 81, 46, 90, 63, 77, 55][id % 8]; }
function mockSubtopics(topic: SyllabusNodeResponse): { id: number; title: string; progress: number }[] {
  if (topic.children.length) return topic.children.map(c => ({ id: c.id, title: c.title, progress: c.progress ?? mockProgress(c.id) }));
  const names = [
    `Conceitos fundamentais de ${topic.title}`,
    `Aplicação prática`,
    `Jurisprudência relacionada`,
    `Questões de prova`,
  ];
  return names.map((title, i) => ({ id: topic.id * 100 + i, title, progress: mockProgress(topic.id + i) }));
}

export function StudyTopicDialog({ target, completed, onClose, onToggleComplete, onViewSubject, onStartPomodoro }: TopicProps) {
  const [revision, setRevision] = useState(false);
  const [activeResource, setActiveResource] = useState<'materials' | 'flashcards' | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  if (!target) return null;
  const unavailable = (feature: string) => toast.info(`${feature} será conectado ao backend.`);

  const progress = target.topic.progress ? Math.round(target.topic.progress) : mockProgress(target.topic.id);
  const subtopics = mockSubtopics(target.topic);
  const questions = mockQuestions(target.topic.id);
  const accuracy = mockAccuracy(target.topic.id);

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
              <div><small>QUESTÕES</small><strong>{questions}</strong></div>
              <div><small>ACERTOS</small><strong>{accuracy}%</strong></div>
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
                <header><div><span className="sp-dialog-label">Materiais do tópico</span><strong>Conteúdo para continuar estudando</strong></div><div className="sp-resource-heading-actions"><small>3 itens</small><button onClick={() => toast.success('Material importado em modo de demonstração.')}>＋ Importar</button></div></header>
                <div className="sp-material-list">
                  <div><span>PDF</span><button className="sp-resource-open" onClick={() => { setPdfPage(1); setPdfOpen(true); }}><strong>Resumo completo — {target.topic.title}</strong><small>24 páginas · atualizado há 2 dias</small></button><em>82%</em><button className="sp-resource-delete" onClick={() => toast.success('Material apagado em modo de demonstração.')} aria-label="Apagar material">×</button></div>
                  <div><span>VÍDEO</span><button className="sp-resource-open" onClick={() => toast.success('Videoaula aberta em modo de demonstração.')}><strong>Aula comentada e exemplos práticos</strong><small>38 min · Professor Kurumí</small></button><em>24%</em><button className="sp-resource-delete" onClick={() => toast.success('Material apagado em modo de demonstração.')} aria-label="Apagar material">×</button></div>
                  <div><span>LINK</span><button className="sp-resource-open" onClick={() => toast.success('Caderno aberto em modo de demonstração.')}><strong>Caderno de questões da banca</strong><small>32 questões selecionadas</small></button><em>Novo</em><button className="sp-resource-delete" onClick={() => toast.success('Material apagado em modo de demonstração.')} aria-label="Apagar material">×</button></div>
                </div>
              </section>
            )}
            {activeResource === 'flashcards' && (
              <section className="sp-topic-resource">
                <header><div><span className="sp-dialog-label">Flashcards</span><strong>Revisão rápida do tópico</strong></div><div className="sp-resource-heading-actions"><small>{6 + target.topic.id % 8} cards</small><button onClick={() => toast.success('Flashcards importados em modo de demonstração.')}>＋ Importar</button></div></header>
                <div className="sp-flashcard-list-mock">
                  {[
                    [`Qual é o conceito central de ${target.topic.title}?`, 'Definição, características e aplicação prática do conceito.'],
                    [`Quais são os principais elementos de ${target.topic.title}?`, 'Sujeito, objeto, requisitos e efeitos previstos.'],
                    ['Qual é a exceção mais cobrada em prova?', 'A hipótese excepcional depende dos requisitos específicos do enunciado.'],
                  ].map(([question, answer], index) => <article key={question}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{question}</strong><small>{answer}</small></div><button onClick={() => toast.success('Flashcard aberto para edição.')} aria-label="Editar flashcard">Editar</button><button className="sp-resource-delete" onClick={() => toast.success('Flashcard apagado em modo de demonstração.')} aria-label="Apagar flashcard">×</button></article>)}
                </div>
              </section>
            )}
            <span className="sp-dialog-label">Subtópicos</span>
            {subtopics.length
              ? (
                <div className="sp-subtopic-list">
                  {subtopics.map(child => (
                    <button data-pomodoro-trigger key={child.id} onClick={() => onStartPomodoro(child.id)} title="Iniciar estudo deste subtópico">
                      <span>↳</span><strong>{child.title}</strong><small>{Math.round(child.progress)}%</small>
                    </button>
                  ))}
                </div>
              )
              : <p className="sp-dialog-empty">Este tópico ainda não possui subtópicos cadastrados.</p>
            }
          </div>
        </div>

        <footer className="sp-topic-panel-footer">
          <button onClick={onViewSubject}>Ver matéria completa</button>
          <button className="filled-button" onClick={() => { onToggleComplete(); onClose(); }}>
            {completed ? 'Marcar pendente' : 'Concluir tópico'}
          </button>
        </footer>

      </aside>
      {pdfOpen && <section className="sp-pdf-reader" onMouseDown={event => event.stopPropagation()}>
        <header><div><span>PDF · {target.area.title}</span><strong>Resumo completo — {target.topic.title}</strong></div><div><button onClick={() => setPdfOpen(false)} aria-label="Fechar PDF">×</button></div></header>
        <div className="sp-pdf-toolbar"><button disabled={pdfPage === 1} onClick={() => setPdfPage(page => Math.max(1, page - 1))}>‹</button><span>Página {pdfPage} de 24</span><button disabled={pdfPage === 24} onClick={() => setPdfPage(page => Math.min(24, page + 1))}>›</button><small>100%</small></div>
        <div className="sp-pdf-stage"><article><span>{target.area.title}</span><h2>{target.topic.title}</h2><p className="sp-pdf-lead">Resumo direcionado para revisão e resolução de questões.</p><h3>{pdfPage === 1 ? 'Conceitos fundamentais' : `Seção ${pdfPage}`}</h3><p>Este material reúne os pontos essenciais do conteúdo, suas principais características e aplicações em provas. Use as marcações para identificar conceitos que merecem ser transformados em flashcards.</p><p>Os elementos mais cobrados devem ser revisados periodicamente, relacionando a regra geral, suas exceções e exemplos práticos.</p><blockquote>Dica de estudo: transforme definições, requisitos e exceções em perguntas objetivas.</blockquote><footer>{pdfPage}</footer></article></div>
      </section>}
    </div>
  );
}
