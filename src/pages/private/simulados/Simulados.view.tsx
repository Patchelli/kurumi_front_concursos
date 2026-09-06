import { useMemo, useState } from 'react';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import type { SimuladosViewProps } from './Simulados.type';
import { JourneySidebarAccountActions } from '@components/layout/JourneyProfileLink';
import { JourneyMobileMenu } from '@components/layout/JourneyMobileMenu';
import { simuladosTokens as t } from './Simulados.tokens';
import { ConfirmDialog } from '@components/dialog/ConfirmDialog';

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
    <div className={t.scoreRing}>
      <svg className={t.scoreRingSvg} viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ede7f6" strokeWidth="5"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          transform="rotate(-90 28 28)"/>
      </svg>
      <span className={t.scoreRingLabel} style={{ color: scoreColor(score) }}>{score}%</span>
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
    <div className={`${t.mfBlock}${expanded ? ` ${t.mfBlockOpen}` : ''}`}>
      <div className={t.mfHead}>
        <span className={t.mfTitle}>{title}</span>
        <div className={t.mfQuick}>
          <div className={t.mfInputWrap}>
            <span className={t.mfInputLabel}>Questões{maxQuestoes > 0 ? ` (máx ${maxQuestoes})` : ''}</span>
            <input className={`${t.mfInput} ${t.noSpin}`} type="number" min="0" max={maxQuestoes || undefined} placeholder="—"
              disabled={maxQuestoes === 0 && q === 0}
              value={data.questoes}
              onChange={ev => onChange({ questoes: clampQ(ev.target.value) })}/>
          </div>
          <div className={t.mfInputWrap}>
            <span className={t.mfInputLabel}>Acertos</span>
            <input className={`${t.mfInput} ${t.noSpin}`} type="number" min="0" max={q || undefined} placeholder="—"
              value={data.acertos}
              onChange={ev => onChange({ acertos: String(Math.min(parseInt(ev.target.value) || 0, q)) })}/>
          </div>
          {q > 0 && <span className={t.mfErros}>{erros} erros</span>}
        </div>
        <button type="button" className={t.mfToggle} onClick={onToggle}>
          {expanded ? 'Fechar' : 'Detalhar'}
        </button>
      </div>

      {expanded && (
        <div className={t.mfDetail}>

          <div className={t.mfRow}>
            <div className={`${t.field} ${t.fieldSm}`}>
              <span className={t.fieldLabel}>Anuladas</span>
              <input className={`${t.fieldInput} ${t.fieldSmInput} ${t.noSpin}`} type="number" min="0" placeholder="0"
                value={data.anuladas} onChange={ev => onChange({ anuladas: ev.target.value })}/>
            </div>
          </div>

          <div className={t.mfMotivosHeader}>
            <span>Motivos dos erros</span>
            {erros > 0 && (
              <span className={`${t.mfDistBadge}${distribuido === erros ? ` ${t.mfDistBadgeOk}` : ''}`}>
                {distribuido}/{erros} distribuídos
              </span>
            )}
          </div>
          <div className={t.mfMotivos}>
            {MOTIVOS.map(motivo => (
              <div key={motivo} className={t.mfMotivoRow}>
                <span className={t.mfMotivoLabel}>{motivo}</span>
                <input className={`${t.mfMotivoInput} ${t.noSpin}`} type="number" min="0" placeholder="0"
                  value={data.motivosErros[motivo]}
                  onChange={ev => onChange({ motivosErros: { ...data.motivosErros, [motivo]: ev.target.value } })}/>
              </div>
            ))}
          </div>

          <div className={t.field} style={{ marginTop: 8 }}>
            <span className={t.fieldLabel}>Observações <em className={t.fieldLabelEm}>(opcional)</em></span>
            <textarea className={t.obs} maxLength={500} rows={3}
              placeholder="Assuntos das questões erradas, percepções…"
              value={data.observacoes} onChange={ev => onChange({ observacoes: ev.target.value })}/>
            <span className={t.obsCount}>{data.observacoes.length}/500</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── View ── */
export function SimuladosView({
  journey, loading, entries: storedEntries, saving, onSave, onDelete,
  onBack, onOverview, onOpenStudyPlan, onOpenContent, onOpenCapsule,
}: SimuladosViewProps) {
  const areas = journey?.knowledgeAreas ?? [];
  const areaIds = areas.map(a => a.id);

  const entries = useMemo<SimuladoEntry[]>(() => storedEntries.map(e => ({
    id:e.id,name:e.title,fonte:e.source??'',date:e.assessmentDate,
    horas:Math.floor(e.durationMinutes/60),minutos:e.durationMinutes%60,
    totalQuestoes:e.totalQuestions,acertosTotal:e.correctAnswers,notaGeral:e.score!=null?`${Math.round(e.score)}%`:'',
    porMateria:e.breakdown.map(m=>({areaId:m.knowledgeAreaId,areaTitle:areas.find(a=>a.id===m.knowledgeAreaId)?.title??'Matéria',questoes:m.totalQuestions,acertos:m.correctAnswers,anuladas:m.voidedQuestions,motivosErros:Object.fromEntries(MOTIVOS.map(k=>[k,m.errorReasons[k]??0])) as Record<Motivo,number>,observacoes:m.notes??''}))
  })),[storedEntries,areas]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(areaIds));
  const [expandedMateria, setExpandedMateria] = useState<Set<number>>(new Set());
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
  async function deleteEntry(id: number) {
    await onDelete(id);
    setDeletingId(null);
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

  async function submitForm() {
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
    await onSave(editingId,{
      journeyId:journey!.id,title:built.name,source:built.fonte||null,assessmentDate:built.date,
      durationMinutes:built.horas*60+built.minutos,totalQuestions:built.totalQuestoes,correctAnswers:built.acertosTotal,
      breakdown:built.porMateria.map(m=>({knowledgeAreaId:m.areaId,totalQuestions:m.questoes,correctAnswers:m.acertos,voidedQuestions:m.anuladas,errorReasons:m.motivosErros,notes:m.observacoes||null}))
    });
    setFormOpen(false);
  }

  if (loading) return <StudyLoading label="Carregando simulados…" />;
  if (!journey) return <main className="journey-entry"><button onClick={onBack}>← Voltar</button><h1>Concurso não encontrado</h1></main>;

  return (
    <>
    <div className={t.shell}>
      <JourneyMobileMenu active="simulados" onOverview={onOverview} onStudyPlan={onOpenStudyPlan} onCapsule={onOpenCapsule} onContent={onOpenContent} onBack={onBack} />

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
        <JourneySidebarAccountActions />
        <div className="jd-contest-card">
          <div className="jd-thumb">
            {journey.logoUrl ? <img src={journey.logoUrl} alt=""/> : journey.title.slice(0, 2).toUpperCase()}
          </div>
          <div><strong>{journey.title}</strong><small>{journey.institution || 'Concurso'}</small></div>
        </div>
      </aside>

      <main className={t.main}>
        <header className={t.header}>
          <div>
            <span className="jd-page-context">SIMULADOS</span>
            <h1>Registro de resultados</h1>
            <p className={t.headerSub}>{journey.title} · {entries.length} simulado{entries.length !== 1 ? 's' : ''} registrado{entries.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={t.headerActions}>
          <button type="button" className={t.createButton} onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Simulado
          </button>
          <button type="button" className="jd-back-link" onClick={onBack}>
            <svg viewBox="0 0 24 24" aria-hidden><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Voltar
          </button>
          </div>
        </header>

        {stats && (
          <div className={t.stats}>
            <div className={t.stat}><strong className={t.statValue}>{stats.total}</strong><small className={t.statLabel}>Registrados</small></div>
            <div className={t.statDivider}/>
            <div className={t.stat}><strong className={t.statValue}>{stats.totalQ}</strong><small className={t.statLabel}>Questões</small></div>
            <div className={t.statDivider}/>
            <div className={t.stat}><strong className={t.statValue} style={{ color: scoreColor(stats.avg) }}>{stats.avg}%</strong><small className={t.statLabel}>Média</small></div>
            <div className={t.statDivider}/>
            <div className={t.stat}><strong className={t.statValue} style={{ color: scoreColor(stats.best) }}>{stats.best}%</strong><small className={t.statLabel}>Melhor</small></div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className={t.empty}>
            <div className={t.emptyIcon}>
              <svg viewBox="0 0 48 48" fill="none" width="48" height="48" aria-hidden>
                <rect x="8" y="10" width="32" height="32" rx="6" stroke="#c8b8e0" strokeWidth="2.5"/>
                <path d="M16 20h16M16 27h10" stroke="#c8b8e0" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M30 6v8M18 6v8" stroke="#c8b8e0" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <strong>Nenhum simulado registrado</strong>
            <p>Registre um resultado para acompanhar sua evolução.</p>
            <button type="button" className={t.emptyButton} onClick={openCreate}>+ Simulado</button>
          </div>
        ) : (
          <div className={t.results}>
            {entries.map(e => {
              const score = pct(e.acertosTotal, e.totalQuestoes);
              const isOpen = expandedResult === e.id;
              return (
                <article key={e.id} className={t.resultRow} onClick={() => e.porMateria.length > 0 && setExpandedResult(isOpen ? null : e.id)} onKeyDown={ev => { if ((ev.key === 'Enter' || ev.key === ' ') && e.porMateria.length > 0) { ev.preventDefault(); setExpandedResult(isOpen ? null : e.id); } }} role={e.porMateria.length > 0 ? 'button' : undefined} tabIndex={e.porMateria.length > 0 ? 0 : undefined}>
                  <ScoreRing score={score}/>

                  <div className={t.resultBody}>
                    <strong>{e.name}</strong>
                    <div className={t.resultTags}>
                      {e.fonte && <><span>{e.fonte}</span><span className={t.resultSep}>·</span></>}
                      <span>{e.totalQuestoes} questões</span>
                      <span className={t.resultSep}>·</span>
                      <span>{e.acertosTotal} acertos</span>
                      <span className={t.resultSep}>·</span>
                      <span>{e.totalQuestoes - e.acertosTotal} erros</span>
                      {(e.horas > 0 || e.minutos > 0) && <><span className={t.resultSep}>·</span><span>{fmtDuration(e.horas, e.minutos)}</span></>}
                      {e.notaGeral && <><span className={t.resultSep}>·</span><span>Nota: {e.notaGeral}</span></>}
                    </div>
                    <small className={t.resultDate}>{new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                  </div>

                  <div className={t.resultActions} onClick={ev => ev.stopPropagation()}>
                    {e.porMateria.length > 0 && (
                      <button className={`${t.actionBtn} ${t.actionGhost}`}
                        onClick={() => setExpandedResult(isOpen ? null : e.id)}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M3 12h12M3 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        {isOpen ? 'Fechar' : 'Matérias'}
                      </button>
                    )}
                    <button className={`${t.actionBtn} ${t.actionIcon}`} onClick={() => openEdit(e)} title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button className={`${t.actionBtn} ${t.actionDanger}`} onClick={() => setDeletingId(e.id)} title="Apagar">
                      <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/></svg>
                    </button>
                  </div>

                  {isOpen && (
                    <div className={t.materiaBreakdown}>
                      {e.porMateria.map(m => {
                        const mp = pct(m.acertos, m.questoes);
                        const erros = m.questoes - m.acertos - (m.anuladas || 0);
                        const totalMotivos = MOTIVOS.reduce((s, k) => s + (m.motivosErros[k] || 0), 0);
                        const hasMotivos = totalMotivos > 0;
                        return (
                          <div key={m.areaId} className={t.materiaDetailBlock}>
                            <div className={t.materiaRow}>
                              <span className={t.materiaName}>{m.areaTitle}</span>
                              <div className={t.materiaBarWrap}>
                                <div className={t.materiaBar} style={{ width: `${mp}%`, background: scoreColor(mp) }}/>
                              </div>
                              <span className={t.materiaPct} style={{ color: scoreColor(mp) }}>{mp}%</span>
                              <span className={t.materiaDetail}>{m.acertos}/{m.questoes}{m.anuladas ? ` · ${m.anuladas} an.` : ''}</span>
                            </div>
                            {hasMotivos && (
                              <div className={t.motivosChips}>
                                {MOTIVOS.filter(k => m.motivosErros[k] > 0).map(k => (
                                  <span key={k} className={t.motivoChip}>
                                    {k}: <strong>{m.motivosErros[k]}</strong>
                                  </span>
                                ))}
                                {erros > 0 && totalMotivos < erros && (
                                  <span className={`${t.motivoChip} ${t.motivoChipWarn}`}>
                                    Não distr.: <strong>{erros - totalMotivos}</strong>
                                  </span>
                                )}
                              </div>
                            )}
                            {m.observacoes && (
                              <p className={t.materiaObs}>"{m.observacoes}"</p>
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

    </div>

    {/* ── Form overlay ── */}
    {formOpen && (
      <div className={t.overlay} onMouseDown={() => setFormOpen(false)}>
        <div className={t.dialog} onMouseDown={e => e.stopPropagation()}>
          <div className={t.dialogHeader}>
            <div>
              <span className={t.dialogEyebrow}>{editingId !== null ? 'EDITAR' : 'NOVO'}</span>
              <h2 className={t.dialogTitle}>{editingId !== null ? 'Editar simulado' : 'Novo simulado'}</h2>
            </div>
            <button className={t.dialogClose} onClick={() => setFormOpen(false)} aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className={t.createForm}>

            <div className={t.field}>
              <span className={t.fieldLabel}>Nome do simulado</span>
              <input className={t.fieldInput} type="text" placeholder="Ex: Simulado CESPE — agosto 2026"
                value={form.name} onChange={ev => setField('name', ev.target.value)}/>
            </div>

            <div className={t.fieldRow}>
              <div className={t.field}>
                <span className={t.fieldLabel}>Fonte / banca</span>
                <input className={t.fieldInput} type="text" placeholder="Ex: CESPE, FCC…"
                  value={form.fonte} onChange={ev => setField('fonte', ev.target.value)}/>
              </div>
              <div className={t.field}>
                <span className={t.fieldLabel}>Data de realização</span>
                <input className={t.fieldInput} type="date" value={form.date} onChange={ev => setField('date', ev.target.value)}/>
              </div>
            </div>

            <div className={t.field}>
              <span className={t.fieldLabel}>Tempo gasto</span>
              <div className={t.fieldRow}>
                <div className={t.field}>
                  <span className={t.fieldLabel}>Horas</span>
                  <input className={`${t.fieldInput} ${t.noSpin}`} type="number" min="0" max="12" placeholder="0"
                    value={form.horas} onChange={ev => setField('horas', ev.target.value)}/>
                </div>
                <div className={t.field}>
                  <span className={t.fieldLabel}>Minutos</span>
                  <input className={`${t.fieldInput} ${t.noSpin}`} type="number" min="0" max="59" placeholder="0"
                    value={form.minutos} onChange={ev => setField('minutos', ev.target.value)}/>
                </div>
              </div>
            </div>

            <div className={t.fieldRow3}>
              <div className={t.field}>
                <span className={t.fieldLabel}>Total de questões</span>
                <input className={`${t.fieldInput} ${t.noSpin}`} type="number" min="1" placeholder="100"
                  value={form.totalQuestoes} onChange={ev => setField('totalQuestoes', ev.target.value)}/>
              </div>
              <div className={t.field}>
                <span className={t.fieldLabel}>Acertos total</span>
                <input className={`${t.fieldInput} ${t.noSpin}`} type="number" min="0" placeholder="70"
                  value={form.acertosTotal} onChange={ev => setField('acertosTotal', ev.target.value)}/>
              </div>
              <div className={t.field}>
                <span className={t.fieldLabel}>Nota geral <em className={t.fieldLabelEm}>(calculada)</em></span>
                <input className={`${t.fieldInput} ${t.fieldInputReadonly}`} type="text" placeholder="Será calculada em %"
                  value={notaCalculada} readOnly aria-readonly="true"/>
              </div>
            </div>

            {areas.length > 0 && (
              <div className={t.field}>
                <span className={t.fieldLabel}>Por matéria</span>
                <span className={t.mfTotalHint}>
                  Distribuídas: {Object.values(form.porMateria).reduce((sum, m) => sum + (parseInt(m.questoes, 10) || 0), 0)} / {parseInt(form.totalQuestoes, 10) || 0}
                  {' · '}{Math.max(0, (parseInt(form.totalQuestoes, 10) || 0) - Object.values(form.porMateria).reduce((sum, m) => sum + (parseInt(m.questoes, 10) || 0), 0))} restantes
                </span>
          <div className={t.mfList}>
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

          <div className={t.dialogFooter}>
            <button className={t.btnGhost} onClick={() => setFormOpen(false)}>Cancelar</button>
            <button className={t.btnPrimary} disabled={saving} onClick={() => void submitForm()}>
              Salvar
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}

    {journey && <ContestFAB journeyId={journey.id} areas={areas}/>}
    <ConfirmDialog open={deletingId !== null} title="Excluir simulado?" description="O resultado e todo o detalhamento por matéria serão removidos." confirmLabel="Excluir" danger onClose={() => setDeletingId(null)} onConfirm={() => deletingId !== null && void deleteEntry(deletingId)}/>
    </>
  );
}
