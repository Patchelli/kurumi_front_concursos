import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { flashcardService, type FlashcardReviewIntervals } from '../../../@business/service/Flashcard.service';
import { getRequestErrorMessage } from '../../utils/getRequestErrorMessage';

const defaults: FlashcardReviewIntervals = { againHours: 24, hardHours: 5, goodHours: 72, easyHours: 168 };
const fields: Array<[keyof FlashcardReviewIntervals, string, string]> = [
  ['againHours', 'De novo', '24 horas = 1 dia'],
  ['hardHours', 'Difícil', '5 horas'],
  ['goodHours', 'Bom', '72 horas = 3 dias'],
  ['easyHours', 'Fácil', '168 horas = 7 dias'],
];

export function FlashcardReviewIntervalsModal({ onClose }: { onClose(): void }) {
  const [intervals, setIntervals] = useState<FlashcardReviewIntervals>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    flashcardService.reviewIntervals()
      .then(value => active && setIntervals(value))
      .catch(error => active && toast.error(getRequestErrorMessage(error, 'Não foi possível carregar os intervalos.')))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const save = async () => {
    if (Object.values(intervals).some(value => !Number.isInteger(value) || value < 1 || value > 8760)) {
      return void toast.error('Informe intervalos inteiros entre 1 hora e 365 dias.');
    }
    setSaving(true);
    try {
      await flashcardService.saveReviewIntervals(intervals);
      toast.success('Intervalos de revisão salvos.');
      onClose();
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Não foi possível salvar os intervalos.'));
    } finally {
      setSaving(false);
    }
  };

  return <div className="fc-intervals-overlay" onMouseDown={onClose}>
    <section className="fc-intervals-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fc-intervals-title">
      <header><div><span>CONFIGURAÇÕES</span><h3 id="fc-intervals-title">Intervalos de revisão</h3><p>Defina quando o card volta após cada resposta.</p></div><button onClick={onClose} aria-label="Fechar">×</button></header>
      <div className="fc-intervals-body">{fields.map(([key, label, hint]) => <label key={key}><span>{label}</span><div><input type="number" min="1" max="8760" step="1" value={intervals[key]} disabled={loading || saving} onChange={event => setIntervals(current => ({ ...current, [key]: Number(event.target.value) }))} /><small>horas</small></div><em>{hint}</em></label>)}</div>
      <footer><button onClick={onClose} disabled={saving}>Cancelar</button><button className="filled-button" onClick={() => void save()} disabled={loading || saving}>{saving ? 'Salvando…' : 'Salvar intervalos'}</button></footer>
    </section>
  </div>;
}
