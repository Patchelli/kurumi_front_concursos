import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { studyResourceService, type StudyResource } from '@business/service/StudyResource.service';

export function QuestionNotebookDialog({ journeyId, knowledgeAreaId, syllabusNodeId, title, onClose }: {
  journeyId: number;
  knowledgeAreaId: number;
  syllabusNodeId?: number | null;
  title: string;
  onClose(): void;
}) {
  const [items, setItems] = useState<StudyResource[]>([]);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const resources = await studyResourceService.list(journeyId, syllabusNodeId ?? undefined, syllabusNodeId ? undefined : knowledgeAreaId);
      setItems(resources.filter(item => Number(item.kind) === 3 || String(item.kind) === 'QuestionNotebook'));
    } catch { toast.error('Nao foi possivel carregar os cadernos.'); }
  };
  useEffect(() => { void load(); }, [journeyId, knowledgeAreaId, syllabusNodeId]);
  const save = async () => {
    const value = url.trim();
    if (!value) return;
    setSaving(true);
    try {
      await studyResourceService.register({ journeyId, knowledgeAreaId, syllabusNodeId: syllabusNodeId ?? null, title: `TecConcursos ${title}`, url: value, kind: 3 });
      setUrl(''); await load(); window.dispatchEvent(new CustomEvent('question-notebooks-changed', { detail: { journeyId } })); toast.success('Caderno de questoes salvo.');
    } catch { toast.error('Informe um link valido do TecConcursos.'); }
    finally { setSaving(false); }
  };
  return createPortal(<div className="sb-review-overlay" onMouseDown={event => event.currentTarget === event.target && onClose()}>
    <section className="sb-review-dialog qn-dialog" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true">
      <header><div><span>CADERNO DE QUESTOES</span><h2>{title}</h2></div><button onClick={onClose} aria-label="Fechar">X</button></header>
      <div className="sb-review-body qn-body">
        <p className="qn-instruction">No TecConcursos, abra o caderno filtrado para este conteudo, copie o link da pagina e cole aqui.</p>
        <div className="qn-form"><input value={url} inputMode="url" aria-label="Link do caderno no TecConcursos" onChange={event => setUrl(event.target.value)} placeholder="https://www.tecconcursos.com.br/..." onKeyDown={event => event.key === 'Enter' && void save()} /><button type="button" onClick={() => void save()} disabled={saving || !url.trim()}>{saving ? 'Vinculando...' : 'Vincular caderno'}</button></div>
        {items.length ? <div className="qn-list">{items.map(item => <article key={item.id}><a href={item.url} target="_blank" rel="noreferrer"><span>T</span><strong>Abrir caderno no TecConcursos</strong><small>{item.title}</small></a><button type="button" aria-label={`Excluir ${item.title}`} onClick={() => void studyResourceService.remove(item.id).then(() => { window.dispatchEvent(new CustomEvent('question-notebooks-changed', { detail: { journeyId } })); return load(); }).catch(() => toast.error('Nao foi possivel excluir o caderno.'))}>x</button></article>)}</div> : <p className="qn-empty">Nenhum caderno vinculado a este conteudo.</p>}
      </div>
      <footer><button onClick={onClose}>Fechar</button></footer>
    </section>
  </div>, document.body);
}