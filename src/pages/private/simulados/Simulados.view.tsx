import { useMemo, useState } from 'react';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import type { SimuladosViewProps } from './Simulados.type';

/* ── Constants ── */
const MOTIVOS = [
  'Desconhecimento', 'Esquecimento', 'Confusão conceitual',
  'Erro de interpretação', 'Falta de atenção', 'Falta de tempo', 'Não especificado',
] as const;
type Motivo = typeof MOTIVOS[number];

/* ── Types ── */
interface MateriaEntry {
  areaId: number; areaTitle: string;
  questoes: number; acertos: number; anuladas: number;
  motivosErros: Record<Motivo, number>;
  observacoes: string;
}

interface SimuladoEntry {
  id: number; name: string; fonte: string; date: string;
  horas: number; minutos: number;
  totalQuestoes: number; acertosTotal: number; notaGeral: string;
  porMateria: MateriaEntry[];
}

interface MateriaForm {
  questoes: string; acertos: string; anuladas: string;
  motivosErros: Record<Motivo, string>;
  observacoes: string;
}

interface FormState {
  name: string; fonte: string; date: string;
  horas: string; minutos: string;
  totalQuestoes: string; acertosTotal: string; notaGeral: string;
  porMateria: Record<number, MateriaForm>;
}

/* ── Helpers ── */
function pct(acertos: number, total: number) {
  if (!total) return 0;
  return Math.round((acertos / total) * 100);
}
function scoreColor(p: number) {
  if (p >= 70) return '#1a7a62';
  if (p >= 50) return '#b56a1a';
  return '#9c2843';
}
function fmtDuration(h: number, m: number) {
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}
function emptyMateriaForm(): MateriaForm {
  const motivosErros = {} as Record<Motivo, string>;
  MOTIVOS.forEach(m => { motivosErros[m] = ''; });
  return { questoes: '', acertos: '', anuladas: '', motivosErros, observacoes: '' };
}
function emptyForm(areaIds: number[]): FormState {
  const pm: FormState['porMateria'] = {};
  areaIds.forEach(id => { pm[id] = emptyMateriaForm(); });
  return { name: '', fonte: '', date: '', horas: '', minutos: '', totalQuestoes: '', acertosTotal: '', notaGeral: '', porMateria: pm };
}
function entryToForm(e: SimuladoEntry, areaIds: number[]): FormState {
  const pm: FormState['porMateria'] = {};
  areaIds.forEach(id => { pm[id] = emptyMateriaForm(); });
  e.porMateria.forEach(m => {
    const motivos = {} as Record<Motivo, string>;
    MOTIVOS.forEach(k => { motivos[k] = m.motivosErros[k] ? String(m.motivosErros[k]) : ''; });
    pm[m.areaId] = { questoes: String(m.questoes), acertos: String(m.acertos), anuladas: String(m.anuladas || ''), motivosErros: motivos, observacoes: m.observacoes };
  });
  return {
    name: e.name, fonte: e.fonte, date: e.date,
    horas: String(e.horas), minutos: String(e.minutos),
    totalQuestoes: String(e.totalQuestoes), acertosTotal: String(e.acertosTotal),
    notaGeral: e.notaGeral, porMateria: pm,
  };
}

/* ── Sub-components ── */
function ScoreRing({ score }: { score: number }) {
  const r = 24, circ = 2 * Math.PI * r;
  return (
    <div className="sm-score-ring">
      <svg viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ede7f6" strokeWidth="5"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          transform="rotate(-90 28 28)"/>
      </svg>
      <span style={{ color: scoreColor(score) }}>{score}%</span>
    </div>
  );
}

/* materia form block (inside dialog) */
function MateriaFormBlock({
  title, data, onChange, expanded, onToggle, maxQuestoes,
}: {
  title: string; data: MateriaForm;
  onChange(patch: Partial<MateriaForm> | { motivosErros: Partial<Record<Motivo, string>> }): void;
  expanded: boolean; onToggle(): void;
  maxQuestoes: number;
}) {
  const q = parseInt(data.questoes) || 0;
  const a = parseInt(data.acertos) || 0;
  const anuladas = parseInt(data.anuladas) || 0;
  const erros = Math.max(0, q - a - anuladas);
  const distribuido = MOTIVOS.reduce((s, m) => s + (parseInt(data.motivosErros[m]) || 0), 0);

  function clampQ(raw: string) {
    if (raw.trim() === '') return '';
    const v = Math.max(0, parseInt(raw, 10) || 0);
    return maxQuestoes > 0 ? String(Math.min(v, maxQuestoes)) : '0';
  }

  return (
    <div className={`sm-mf-block${expanded ? ' sm-mf-block--open' : ''}`}>
      <div className="sm-mf-head">
        <span className="sm-mf-title">{title}</span>
        <div className="sm-mf-quick">
          <div className="sm-mf-input-wrap">
            <span className="sm-mf-input-label">Questões{maxQuestoes > 0 ? ` (máx ${maxQuestoes})` : ''}</span>
            <input className="sm-no-spin" type="number" min="0" max={maxQuestoes || undefined} placeholder="—"
              disabled={maxQuestoes === 0 && q === 0}
              value={data.questoes}
              onChange={ev => onChange({ questoes: clampQ(ev.target.value) })}/>
          </div>
          <div className="sm-mf-input-wrap">
            <span className="sm-mf-input-label">Acertos</span>
            <input className="sm-no-spin" type="number" min="0" max={q || undefined} placeholder="—"
              value={data.acertos}
              onChange={ev => onChange({ acertos: String(Math.min(parseInt(ev.target.value) || 0, q)) })}/>
          </div>
          {q > 0 && <span className="sm-mf-erros">{erros} erros</span>}
        </div>
        <button type="button" className="sm-mf-toggle" onClick={onToggle}>
          {expanded ? 'Fechar' : 'Detalhar'}
        </button>
      </div>

      {expanded && (
        <div className="sm-mf-detail">

          <div className="sm-mf-row">
            <label className="sm-field sm-field--sm">
              <span>Anuladas</span>
              <input className="sm-no-spin" type="number" min="0" placeholder="0"
                value={data.anuladas} onChange={ev => onChange({ anuladas: ev.target.value })}/>
            </label>
          </div>

          <div className="sm-mf-motivos-header">
            <span>Motivos dos erros</span>
            {erros > 0 && (
              <span className={`sm-mf-dist-badge${distribuido === erros ? ' sm-mf-dist-badge--ok' : ''}`}>
                {distribuido}/{erros} distribuídos
              </span>
            )}
          </div>
          <div className="sm-mf-motivos">
            {MOTIVOS.map(motivo => (
              <label key={motivo} className="sm-mf-motivo-row">
                <span>{motivo}</span>
                <input className="sm-no-spin" type="number" min="0" placeholder="0"
                  value={data.motivosErros[motivo]}
                  onChange={ev => onChange({ motivosErros: { ...data.motivosErros, [motivo]: ev.target.value } })}/>
              </label>
            ))}
          </div>

          <label className="sm-field sm-field--sm" style={{ marginTop: 8 }}>
            <span>Observações <em>(opcional)</em></span>
            <textarea className="sm-obs" maxLength={500} rows={3}
              placeholder="Assuntos das questões erradas, percepções…"
              value={data.observacoes} onChange={ev => onChange({ observacoes: ev.target.value })}/>
            <span className="sm-obs-count">{data.observacoes.length}/500</span>
          </label>
        </div>
      )}
    </div>
  );
}

/* ── View ── */
export function SimuladosView({
  journey, loading,
  onBack, onOverview, onOpenStudyPlan, onOpenContent, onOpenCapsule,
}: SimuladosViewProps) {
  const areas = journey?.knowledgeAreas ?? [];
  const areaIds = areas.map(a => a.id);

  const [entries, setEntries] = useState<SimuladoEntry[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(areaIds));
  const [expandedMateria, setExpandedMateria] = useState<Set<number>>(new Set());
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const totalFormQuestoes = Math.max(0, parseInt(form.totalQuestoes, 10) || 0);
  const acertosForm = Math.max(0, Math.min(parseInt(form.acertosTotal, 10) || 0, totalFormQuestoes));
  const notaCalculada = totalFormQuestoes > 0 && form.acertosTotal.trim() !== ''
    ? `${pct(acertosForm, totalFormQuestoes)}%`
    : '';

  const stats = useMemo(() => {
    if (!entries.length) return null;
    const scores = entries.map(e => pct(e.acertosTotal, e.totalQuestoes));
    return {
      total: entries.length,
      totalQ: entries.reduce((s, e) => s + e.totalQuestoes, 0),
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
    };
  }, [entries]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(areaIds));
    setExpandedMateria(new Set());
    setFormOpen(true);
  }
  function openEdit(e: SimuladoEntry) {
    setEditingId(e.id);
    setForm(entryToForm(e, areaIds));
    setExpandedMateria(new Set());
    setFormOpen(true);
  }
  function deleteEntry(id: number) {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (expandedResult === id) setExpandedResult(null);
  }

  function setField(key: keyof Omit<FormState, 'porMateria'>, val: string) {
    setForm(f => {
      const next = { ...f, [key]: val };
      const total = parseInt(key === 'totalQuestoes' ? val : f.totalQuestoes) || 0;
      // acertosTotal cannot exceed totalQuestoes
      if (key === 'totalQuestoes' || key === 'acertosTotal') {
        const acertos = parseInt(key === 'acertosTotal' ? val : f.acertosTotal) || 0;
        if (acertos > total && total > 0) next.acertosTotal = String(total);
      }
      // When the global total changes, keep the already entered distribution valid.
      if (key === 'totalQuestoes' && total > 0) {
        const pm = { ...f.porMateria };
        let remaining = total;
        Object.keys(pm).forEach(idStr => {
          const id = Number(idStr);
          const m = pm[id];
          const q = Math.max(0, parseInt(m.questoes, 10) || 0);
          const newQ = Math.min(q, remaining);
          remaining -= newQ;
          const a = Math.min(parseInt(m.acertos, 10) || 0, newQ);
          const anuladas = Math.min(parseInt(m.anuladas, 10) || 0, newQ);
          if (newQ !== q || a !== (parseInt(m.acertos, 10) || 0) || anuladas !== (parseInt(m.anuladas, 10) || 0)) {
            pm[id] = { ...m, questoes: newQ ? String(newQ) : '', acertos: a ? String(a) : '', anuladas: anuladas ? String(anuladas) : '' };
          }
        });
        next.porMateria = pm;
      }
      return next;
    });
  }
  function patchMateria(areaId: number, patch: Partial<MateriaForm> | { motivosErros: Partial<Record<Motivo, string>> }) {
    setForm(f => {
      const totalGeral = parseInt(f.totalQuestoes) || 0;
      const distribuidoEmOutras = Object.entries(f.porMateria)
        .filter(([id]) => Number(id) !== areaId)
        .reduce((sum, [, materia]) => sum + (parseInt(materia.questoes, 10) || 0), 0);
      const maxDaMateria = totalGeral > 0 ? Math.max(0, totalGeral - distribuidoEmOutras) : 0;
      const prev = f.porMateria[areaId] ?? emptyMateriaForm();
      let next = 'motivosErros' in patch && typeof patch.motivosErros === 'object'
        ? { ...prev, motivosErros: { ...prev.motivosErros, ...patch.motivosErros } }
        : { ...prev, ...(patch as Partial<MateriaForm>) };
      // The sum of all matérias can never exceed the global total.
      const rawQ = Math.max(0, parseInt(next.questoes, 10) || 0);
      if (totalGeral > 0 && rawQ > maxDaMateria) next = { ...next, questoes: String(maxDaMateria) };
      // acertos and anuladas cannot exceed questoes per matéria
      const q = parseInt(next.questoes) || 0;
      const a = parseInt(next.acertos) || 0;
      const anuladas = parseInt(next.anuladas) || 0;
      if (a > q && q > 0) next = { ...next, acertos: String(q) };
      if (anuladas > q && q > 0) next = { ...next, anuladas: String(q) };
      // motivos cannot exceed total erros
      const erros = Math.max(0, q - (parseInt(next.acertos) || 0) - (parseInt(next.anuladas) || 0));
      const totalMotivos = MOTIVOS.reduce((s, k) => s + (parseInt(next.motivosErros[k]) || 0), 0);
      if (totalMotivos > erros && erros >= 0) {
        // find which motivo was just changed and cap it
        const changed = Object.keys(next.motivosErros).find(k => {
          const pk = (prev.motivosErros as Record<string,string>)[k];
          const nk = (next.motivosErros as Record<string,string>)[k];
          return pk !== nk;
        }) as Motivo | undefined;
        if (changed) {
          const others = MOTIVOS.filter(k => k !== changed).reduce((s, k) => s + (parseInt(next.motivosErros[k]) || 0), 0);
          const allowed = Math.max(0, erros - others);
          next = { ...next, motivosErros: { ...next.motivosErros, [changed]: String(allowed) } };
        }
      }
      return { ...f, porMateria: { ...f.porMateria, [areaId]: next } };
    });
  }
  function toggleMateriaExpand(id: number) {
    setExpandedMateria(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function submitForm() {
    const totalQuestoes = Math.max(0, parseInt(form.totalQuestoes, 10) || 0);
    let restante = totalQuestoes;
    const built: SimuladoEntry = {
      id: editingId ?? Date.now(),
      name: form.name.trim() || 'Simulado sem título',
      fonte: form.fonte.trim(),
      date: form.date || new Date().toISOString().slice(0, 10),
      horas: Math.max(0, parseInt(form.horas) || 0),
      minutos: Math.max(0, Math.min(59, parseInt(form.minutos) || 0)),
      totalQuestoes,
      acertosTotal: parseInt(form.acertosTotal) || 0,
      notaGeral: notaCalculada,
      porMateria: areas.map(a => {
        const mf = form.porMateria[a.id] ?? emptyMateriaForm();
        const q = Math.min(Math.max(0, parseInt(mf.questoes, 10) || 0), restante);
        restante -= q;
        const ac = Math.min(parseInt(mf.acertos, 10) || 0, q);
        const motivos = {} as Record<Motivo, number>;
        MOTIVOS.forEach(k => { motivos[k] = parseInt(mf.motivosErros[k]) || 0; });
        return { areaId: a.id, areaTitle: a.title, questoes: q, acertos: ac, anuladas: Math.min(parseInt(mf.anuladas, 10) || 0, q), motivosErros: motivos, observacoes: mf.observacoes.trim() };
      }).filter(m => m.questoes > 0),
    };
    if (editingId !== null) {
      setEntries(prev => prev.map(e => e.id === editingId ? built : e));
    } else {
      setEntries(prev => [built, ...prev]);
    }
    setFormOpen(false);
  }

  if (loading) return <StudyLoading label="Carregando simulados…" />;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  return (
    <>
    <div className="jd-shell sm-shell">

      <aside className="jd-sidebar">
        <div className="jd-brand"><span>K</span><strong>Kurumí</strong></div>
        <nav className="jd-nav">
          <button onClick={onOverview}>
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Visão geral</span>
          </button>
          <button onClick={onOpenStudyPlan}>
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span>Plano de estudos</span>
          </button>
          <button className="active">
            <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Simulados</span>
          </button>
          <button onClick={onOpenCapsule}>
            <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6"/></svg>
            <span>Cápsula</span>
          </button>
          <button onClick={onOpenContent}>
            <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            <span>Conteúdo</span>
          </button>
        </nav>
        <div className="jd-contest-card">
          <div className="jd-thumb">
            {journey.logoUrl ? <img src={journey.logoUrl} alt=""/> : journey.title.slice(0, 2).toUpperCase()}
          </div>
          <div><strong>{journey.title}</strong><small>{journey.institution || 'Concurso'}</small></div>
        </div>
      </aside>

      <main className="sm-main">
        <header className="sm-header">
          <div>
            <span className="jd-page-context">SIMULADOS</span>
            <h1>Registro de resultados</h1>
            <p className="sm-header-sub">{journey.title} · {entries.length} simulado{entries.length !== 1 ? 's' : ''} registrado{entries.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="sm-create-btn" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Registrar simulado
          </button>
        </header>

        {stats && (
          <div className="sm-stats">
            <div className="sm-stat"><strong>{stats.total}</strong><small>Registrados</small></div>
            <div className="sm-stat-div"/>
            <div className="sm-stat"><strong>{stats.totalQ}</strong><small>Questões respondidas</small></div>
            <div className="sm-stat-div"/>
            <div className="sm-stat"><strong style={{ color: scoreColor(stats.avg) }}>{stats.avg}%</strong><small>Média de acertos</small></div>
            <div className="sm-stat-div"/>
            <div className="sm-stat"><strong style={{ color: scoreColor(stats.best) }}>{stats.best}%</strong><small>Melhor resultado</small></div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="sm-empty">
            <div className="sm-empty-icon">
              <svg viewBox="0 0 48 48" fill="none" width="48" height="48" aria-hidden>
                <rect x="8" y="10" width="32" height="32" rx="6" stroke="#c8b8e0" strokeWidth="2.5"/>
                <path d="M16 20h16M16 27h10" stroke="#c8b8e0" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M30 6v8M18 6v8" stroke="#c8b8e0" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <strong>Nenhum simulado registrado</strong>
            <p>Registre um resultado para acompanhar sua evolução.</p>
            <button onClick={openCreate}>Registrar primeiro simulado</button>
          </div>
        ) : (
          <div className="sm-results">
            {entries.map(e => {
              const score = pct(e.acertosTotal, e.totalQuestoes);
              const isOpen = expandedResult === e.id;
              return (
                <article key={e.id} className="sm-result-row">
                  <ScoreRing score={score}/>

                  <div className="sm-result-body">
                    <strong>{e.name}</strong>
                    <div className="sm-result-tags">
                      {e.fonte && <><span>{e.fonte}</span><span className="sm-result-sep">·</span></>}
                      <span>{e.totalQuestoes} questões</span>
                      <span className="sm-result-sep">·</span>
                      <span>{e.acertosTotal} acertos</span>
                      <span className="sm-result-sep">·</span>
                      <span>{e.totalQuestoes - e.acertosTotal} erros</span>
                      {(e.horas > 0 || e.minutos > 0) && <><span className="sm-result-sep">·</span><span>{fmtDuration(e.horas, e.minutos)}</span></>}
                      {e.notaGeral && <><span className="sm-result-sep">·</span><span>Nota: {e.notaGeral}</span></>}
                    </div>
                    <small className="sm-result-date">{new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                  </div>

                  <div className="sm-result-actions">
                    {e.porMateria.length > 0 && (
                      <button className="sm-action-btn sm-action-btn--ghost"
                        onClick={() => setExpandedResult(isOpen ? null : e.id)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M3 12h12M3 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        {isOpen ? 'Fechar' : 'Matérias'}
                      </button>
                    )}
                    <button className="sm-action-btn sm-action-btn--icon" onClick={() => openEdit(e)} title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button className="sm-action-btn sm-action-btn--danger" onClick={() => deleteEntry(e.id)} title="Apagar">
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
                    </button>
                  </div>

                  {isOpen && (
                    <div className="sm-materia-breakdown">
                      {e.porMateria.map(m => {
                        const mp = pct(m.acertos, m.questoes);
                        const erros = m.questoes - m.acertos - (m.anuladas || 0);
                        const totalMotivos = MOTIVOS.reduce((s, k) => s + (m.motivosErros[k] || 0), 0);
                        const hasMotivos = totalMotivos > 0;
                        return (
                          <div key={m.areaId} className="sm-materia-detail-block">
                            <div className="sm-materia-row">
                              <span className="sm-materia-name">{m.areaTitle}</span>
                              <div className="sm-materia-bar-wrap">
                                <div className="sm-materia-bar" style={{ width: `${mp}%`, background: scoreColor(mp) }}/>
                              </div>
                              <span className="sm-materia-pct" style={{ color: scoreColor(mp) }}>{mp}%</span>
                              <span className="sm-materia-detail">{m.acertos}/{m.questoes}{m.anuladas ? ` · ${m.anuladas} an.` : ''}</span>
                            </div>
                            {hasMotivos && (
                              <div className="sm-motivos-chips">
                                {MOTIVOS.filter(k => m.motivosErros[k] > 0).map(k => (
                                  <span key={k} className="sm-motivo-chip">
                                    {k}: <strong>{m.motivosErros[k]}</strong>
                                  </span>
                                ))}
                                {erros > 0 && totalMotivos < erros && (
                                  <span className="sm-motivo-chip sm-motivo-chip--warn">
                                    Não distr.: <strong>{erros - totalMotivos}</strong>
                                  </span>
                                )}
                              </div>
                            )}
                            {m.observacoes && (
                              <p className="sm-materia-obs">"{m.observacoes}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <nav className="journey-mobile-nav">
        <button onClick={onOverview}>◎<span>Visão geral</span></button>
        <button onClick={onOpenStudyPlan}>◷<span>Plano</span></button>
        <button className="active">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Simulados</span>
        </button>
        <button onClick={onOpenCapsule}>✉<span>Cápsula</span></button>
        <button onClick={onOpenContent}>☰<span>Conteúdo</span></button>
      </nav>
    </div>

    {/* ── Form overlay ── */}
    {formOpen && (
      <div className="sm-overlay" onMouseDown={() => setFormOpen(false)}>
        <div className="sm-dialog sm-dialog--create" onMouseDown={e => e.stopPropagation()}>
          <div className="sm-dialog-header">
            <div>
              <span className="eyebrow">{editingId !== null ? 'EDITAR REGISTRO' : 'NOVO REGISTRO'}</span>
              <h2>{editingId !== null ? 'Editar simulado' : 'Registrar simulado'}</h2>
            </div>
            <button className="sm-dialog-close" onClick={() => setFormOpen(false)} aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="sm-create-form">

            <label className="sm-field">
              <span>Nome do simulado</span>
              <input type="text" placeholder="Ex: Simulado CESPE — agosto 2026"
                value={form.name} onChange={ev => setField('name', ev.target.value)}/>
            </label>

            <div className="sm-field-row">
              <label className="sm-field">
                <span>Fonte / banca</span>
                <input type="text" placeholder="Ex: CESPE, FCC…"
                  value={form.fonte} onChange={ev => setField('fonte', ev.target.value)}/>
              </label>
              <label className="sm-field">
                <span>Data de realização</span>
                <input type="date" value={form.date} onChange={ev => setField('date', ev.target.value)}/>
              </label>
            </div>

            <div className="sm-field">
              <span>Tempo gasto</span>
              <div className="sm-field-row">
                <label className="sm-field">
                  <span>Horas</span>
                  <input className="sm-no-spin" type="number" min="0" max="12" placeholder="0"
                    value={form.horas} onChange={ev => setField('horas', ev.target.value)}/>
                </label>
                <label className="sm-field">
                  <span>Minutos</span>
                  <input className="sm-no-spin" type="number" min="0" max="59" placeholder="0"
                    value={form.minutos} onChange={ev => setField('minutos', ev.target.value)}/>
                </label>
              </div>
            </div>

            <div className="sm-field-row sm-field-row--3">
              <label className="sm-field">
                <span>Total de questões</span>
                <input className="sm-no-spin" type="number" min="1" placeholder="100"
                  value={form.totalQuestoes} onChange={ev => setField('totalQuestoes', ev.target.value)}/>
              </label>
              <label className="sm-field">
                <span>Acertos total</span>
                <input className="sm-no-spin" type="number" min="0" placeholder="70"
                  value={form.acertosTotal} onChange={ev => setField('acertosTotal', ev.target.value)}/>
              </label>
              <label className="sm-field">
                <span>Nota geral <em>(calculada)</em></span>
                <input type="text" placeholder="Será calculada em %"
                  value={notaCalculada} readOnly aria-readonly="true"/>
              </label>
            </div>

            {areas.length > 0 && (
              <div className="sm-field">
                <span>Por matéria <em>(opcional — clique em Detalhar para expandir)</em></span>
                <span className="sm-mf-total-hint">
                  Distribuídas: {Object.values(form.porMateria).reduce((sum, m) => sum + (parseInt(m.questoes, 10) || 0), 0)} / {parseInt(form.totalQuestoes, 10) || 0}
                  {' · '}{Math.max(0, (parseInt(form.totalQuestoes, 10) || 0) - Object.values(form.porMateria).reduce((sum, m) => sum + (parseInt(m.questoes, 10) || 0), 0))} restantes
                </span>
                <div className="sm-mf-list">
                  {areas.map(a => (
                    <MateriaFormBlock
                      key={a.id}
                      title={a.title}
                      data={form.porMateria[a.id] ?? emptyMateriaForm()}
                      onChange={patch => patchMateria(a.id, patch)}
                      expanded={expandedMateria.has(a.id)}
                      onToggle={() => toggleMateriaExpand(a.id)}
                      maxQuestoes={(() => {
                        const total = parseInt(form.totalQuestoes, 10) || 0;
                        const outras = Object.entries(form.porMateria)
                          .filter(([id]) => Number(id) !== a.id)
                          .reduce((sum, [, m]) => sum + (parseInt(m.questoes, 10) || 0), 0);
                        return total > 0 ? Math.max(0, total - outras) : 0;
                      })()}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="sm-dialog-footer">
            <button className="sm-btn-ghost" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button className="sm-btn-primary" onClick={submitForm}>
              {editingId !== null ? 'Salvar alterações' : 'Salvar registro'}
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}

    <ContestFAB areas={areas}/>
    </>
  );
}
