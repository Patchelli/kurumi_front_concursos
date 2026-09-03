import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { flashcardService, type FlashcardResponse } from '../../../@business/service/Flashcard.service';
import { getRequestErrorMessage } from '../../utils/getRequestErrorMessage';
import { ConfirmDialog } from '../dialog/ConfirmDialog';

export function FlashcardManager({ journeyId, areaId, nodeId, subjectOnly = false }: { journeyId: number; areaId: number; nodeId?: number; subjectOnly?: boolean }) {
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FlashcardResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<FlashcardResponse | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    flashcardService.list(journeyId, areaId, nodeId)
      .then(items => active && setCards(subjectOnly ? items.filter(item => !item.syllabusNodeId) : items))
      .catch(error => active && toast.error(getRequestErrorMessage(error, 'Não foi possível carregar os flashcards.')))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [journeyId, areaId, nodeId, subjectOnly]);

  async function save() {
    if (!editing?.front.trim() || !editing.back.trim()) return void toast.error('Preencha a frente e o verso.');
    if (editing.model === 'Verdadeiro ou falso' && editing.correctAnswer == null) return void toast.error('Informe o gabarito.');
    setSaving(true);
    try {
      const saved = await flashcardService.update(editing);
      setCards(current => current.map(card => card.id === saved.id ? saved : card));
      setEditing(null);
      toast.success('Flashcard atualizado.');
    } catch (error) { toast.error(getRequestErrorMessage(error, 'Não foi possível editar o flashcard.')); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    try {
      await flashcardService.remove(id);
      setCards(current => current.filter(card => card.id !== id));
      setRevealed(current => { const next = new Set(current); next.delete(id); return next; });
      if (editing?.id === id) setEditing(null);
      setDeleteTarget(null);
      toast.success('Flashcard removido.');
    } catch (error) { toast.error(getRequestErrorMessage(error, 'Não foi possível remover o flashcard.')); }
  }

  if (loading) return <p className="sp-dialog-empty">Carregando flashcards…</p>;
  return <>
    {editing && <div className="sp-flashcard-editor">
      <div><select value={editing.model} onChange={event => setEditing({ ...editing, model: event.target.value, correctAnswer: event.target.value === 'Verdadeiro ou falso' ? editing.correctAnswer : null })}><option>Básico</option><option>Omissão de palavras</option><option>Verdadeiro ou falso</option></select><select value={editing.type} onChange={event => setEditing({ ...editing, type: event.target.value })}><option>Conceito</option><option>Lei seca</option><option>Questão</option><option>Jurisprudência</option></select>{editing.model === 'Verdadeiro ou falso' && <select value={editing.correctAnswer == null ? '' : String(editing.correctAnswer)} onChange={event => setEditing({ ...editing, correctAnswer: event.target.value === '' ? null : event.target.value === 'true' })}><option value="">Gabarito</option><option value="true">Verdadeiro</option><option value="false">Falso</option></select>}</div>
      <input value={editing.front} onChange={event => setEditing({ ...editing, front: event.target.value })}/><textarea rows={3} value={editing.back} onChange={event => setEditing({ ...editing, back: event.target.value })}/><div><button onClick={() => setEditing(null)}>Cancelar</button><button className="filled-button" disabled={saving} onClick={() => void save()}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div>
    </div>}
    {!cards.length ? <p className="sp-dialog-empty">Nenhum flashcard associado aqui.</p> : <div className="sp-flashcard-list-mock">{cards.map((card, index) => {
      const isRevealed = revealed.has(card.id);
      return <article key={card.id} className={isRevealed ? 'sp-flashcard-revealed' : ''}><span>{String(index + 1).padStart(2, '0')}</span><div className="sp-flashcard-content"><strong>{card.front}</strong><small>{card.type} · {card.model}</small>{isRevealed && <p className="sp-flashcard-answer">{card.model === 'Verdadeiro ou falso' && card.correctAnswer != null && <b>{card.correctAnswer ? 'Verdadeiro' : 'Falso'} — </b>}{card.back}</p>}</div><div className="sp-flashcard-actions"><button className="sp-flashcard-eye" onClick={() => setRevealed(current => { const next = new Set(current); next.has(card.id) ? next.delete(card.id) : next.add(card.id); return next; })} aria-label={isRevealed ? 'Ocultar resposta' : 'Mostrar resposta'} title={isRevealed ? 'Ocultar resposta' : 'Mostrar resposta'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/>{isRevealed && <path d="M4 4l16 16"/>}</svg></button><button className="sp-flashcard-edit" onClick={() => setEditing({ ...card })} aria-label="Editar flashcard">Editar</button><button className="sp-resource-delete" onClick={() => setDeleteTarget(card)} aria-label="Apagar flashcard">×</button></div></article>;
    })}</div>}
    <ConfirmDialog open={Boolean(deleteTarget)} title="Excluir flashcard?" description={deleteTarget ? `O flashcard “${deleteTarget.front}” será removido permanentemente.` : ''} confirmLabel="Excluir" danger onConfirm={() => deleteTarget && void remove(deleteTarget.id)} onClose={() => setDeleteTarget(null)} />
  </>;
}
