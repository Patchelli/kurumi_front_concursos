import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { practiceEntryService, type PracticeEntry } from '../../../@business/service/PracticeEntry.service';
import { ConfirmDialog } from '../dialog/ConfirmDialog';
import { notifyTimeCapsuleProgressChanged } from '../../../@business/service/TimeCapsule.service';

const REASONS = [
  'Desconhecimento', 'Esquecimento', 'Confusão conceitual',
  'Erro de interpretação', 'Falta de atenção', 'Falta de tempo', 'Não especificado',
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function QuestionRegisterDialog({ journeyId, knowledgeAreaId, syllabusNodeId, title, onClose, onSaved }: {
  journeyId: number;
  knowledgeAreaId: number;
  syllabusNodeId?: number | null;
  title: string;
  onClose(): void;
  onSaved?(): void;
}) {
  const [items, setItems] = useState<PracticeEntry[]>([]);
  const [editing, setEditing] = useState<PracticeEntry | null>(null);
  const [date, setDate] = useState(today());
  const [total, setTotal] = useState('');
  const [correct, setCorrect] = useState('');
  const [voided, setVoided] = useState('');
  const [notes, setNotes] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    practiceEntryService.list(journeyId, knowledgeAreaId, syllabusNodeId)
      .then(setItems).catch(() => toast.error('Não foi possível carregar as questões.'));

  useEffect(() => { void load(); }, [journeyId, knowledgeAreaId, syllabusNodeId]);

  const edit = (x?: PracticeEntry) => {
    setEditing(x ?? null);
    setDate(x?.practiceDate ?? today());
    setTotal(x ? String(x.questionsAnswered) : '');
    setCorrect(x ? String(x.correctAnswers) : '');
    setVoided(x?.voidedQuestions ? String(x.voidedQuestions) : '');
    setNotes(x?.notes ?? '');
    setReasons(Object.fromEntries(REASONS.map(k => [k, x?.errorReasons[k] ? String(x.errorReasons[k]) : ''])));
  };

  /* ── Derived values ── */
  const q = +total || 0;
  const a = +correct || 0;
  const v = +voided || 0;
  const erros = q - a - v;
  const totalReasons = useMemo(() => Object.values(reasons).reduce((s, v) => s + (+v || 0), 0), [reasons]);
  const pct = q > 0 ? Math.round(a / q * 100) : 0;

  /* ── Clamping helpers ── */
  const clampCorrect = (val: string) => {
    const n = +val || 0;
    setCorrect(n > q ? String(q) : val);
  };
  const clampVoided = (val: string) => {
    const n = +val || 0;
    const max = q - a;
    setVoided(n > max ? String(Math.max(0, max)) : val);
  };
  const clampReason = (key: string, val: string) => {
    const n = +val || 0;
    const othersTotal = Object.entries(reasons).reduce((s, [k, v]) => k === key ? s : s + (+v || 0), 0);
    const max = Math.max(0, erros - othersTotal);
    setReasons(r => ({ ...r, [key]: n > max ? String(max) : val }));
  };

  const save = async () => {
    if (q <= 0) return toast.error('Informe o total de questões.');
    if (a > q) return toast.error('Acertos não pode exceder o total de questões.');
    if (a + v > q) return toast.error('Acertos + anuladas não pode exceder o total.');
    if (totalReasons > erros) return toast.error('Motivos dos erros excede o total de erros.');
    setSaving(true);
    try {
      const body = {
        journeyId, knowledgeAreaId, syllabusNodeId, practiceDate: date,
        questionsAnswered: q, correctAnswers: a, voidedQuestions: v,
        errorReasons: Object.fromEntries(REASONS.map(k => [k, +reasons[k] || 0])),
        notes: notes || null,
      };
      editing ? await practiceEntryService.update(editing.id, body) : await practiceEntryService.register(body);
      notifyTimeCapsuleProgressChanged();
      onSaved?.();
      await load();
      edit();
      toast.success('Questões registradas.');
    } finally { setSaving(false); }
  };

  return (
    <div className="sb-review-overlay" onMouseDown={e => { e.stopPropagation(); if (e.currentTarget === e.target) onClose(); }}>
      <section className="sb-review-dialog qr-dialog" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <header>
          <div>
            <span>PRÁTICA DE QUESTÕES</span>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose}>×</button>
        </header>

        {/* Body */}
        <div className="sb-review-body qr-body">

          {/* Score ring preview */}
          {q > 0 && (
            <div className="qr-score-strip">
              <div className="qr-ring" style={{ '--pct': pct } as React.CSSProperties}>
                <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" /><circle cx="18" cy="18" r="15.5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" /></svg>
                <strong>{pct}%</strong>
              </div>
              <div className="qr-score-meta">
                <span className="qr-pill qr-pill--ok">{a} acertos</span>
                <span className="qr-pill qr-pill--err">{erros > 0 ? erros : 0} erros</span>
                {v > 0 && <span className="qr-pill qr-pill--void">{v} anuladas</span>}
              </div>
            </div>
          )}

          {/* Fields grid */}
          <div className="qr-fields">
            <label className="qr-field">
              <span>Data</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label className="qr-field">
              <span>Questões</span>
              <input type="number" min="1" placeholder="0" value={total} onChange={e => setTotal(e.target.value)} />
            </label>
            <label className="qr-field">
              <span>Acertos</span>
              <input type="number" min="0" max={q} placeholder="0" value={correct} onChange={e => clampCorrect(e.target.value)} />
            </label>
            <label className="qr-field">
              <span>Anuladas</span>
              <input type="number" min="0" max={Math.max(0, q - a)} placeholder="0" value={voided} onChange={e => clampVoided(e.target.value)} />
            </label>
          </div>

          {/* Error reasons */}
          {erros > 0 && (
            <div className="qr-reasons-section">
              <div className="qr-reasons-head">
                <strong>Motivos dos erros</strong>
                <span className={`qr-reasons-badge${totalReasons === erros ? ' qr-reasons-badge--ok' : ''}`}>
                  {totalReasons}/{erros} classificados
                </span>
              </div>
              <div className="qr-reasons-grid">
                {REASONS.map(k => {
                  const othersTotal = Object.entries(reasons).reduce((s, [rk, rv]) => rk === k ? s : s + (+rv || 0), 0);
                  const max = Math.max(0, erros - othersTotal);
                  return (
                    <label className="qr-reason-row" key={k}>
                      <span>{k}</span>
                      <input type="number" min="0" max={max} value={reasons[k] ?? ''} onChange={e => clampReason(k, e.target.value)} placeholder="0" />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <label className="qr-field qr-field--full">
            <span>Observações <em>(opcional)</em></span>
            <textarea maxLength={500} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre esta sessão de questões..." />
          </label>

          {/* History */}
          {items.length > 0 && (
            <div className="qr-history">
              <strong className="qr-history-title">Histórico</strong>
              {items.map(x => {
                const xPct = x.questionsAnswered ? Math.round(x.correctAnswers / x.questionsAnswered * 100) : 0;
                return (
                  <article className="qr-history-row" key={x.id}>
                    <div className={`qr-history-pct${xPct >= 70 ? ' qr-history-pct--good' : xPct >= 40 ? ' qr-history-pct--mid' : ' qr-history-pct--low'}`}>{xPct}%</div>
                    <div className="qr-history-info">
                      <strong>{x.correctAnswers}/{x.questionsAnswered} acertos</strong>
                      <small>{new Date(x.practiceDate + 'T00:00:00').toLocaleDateString('pt-BR')}</small>
                    </div>
                    <div className="qr-history-actions">
                      <button className="qr-hist-btn" type="button" onClick={() => edit(x)} title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="qr-hist-btn qr-hist-btn--danger" type="button" onClick={() => setDeleting(x.id)} title="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M8 6V4h8v2m-7 5v6m4-6v6M5 6l1 14h12l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer>
          <button onClick={onClose}>Fechar</button>
          <button className="filled-button" disabled={saving} onClick={() => void save()}>
            {editing ? 'Salvar' : 'Registrar'}
          </button>
        </footer>
      </section>

      <ConfirmDialog open={deleting !== null} title="Excluir registro?" description="Este registro de questões será removido." confirmLabel="Excluir" danger onClose={() => setDeleting(null)} onConfirm={() => { if (deleting !== null) void practiceEntryService.remove(deleting).then(() => { setDeleting(null); onSaved?.(); void load(); }); }} />
    </div>
  );
}
