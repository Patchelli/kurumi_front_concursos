import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { KnowledgeAreaResponse } from '../../../@business/dto/response/journey.response';
import { flashcardService } from '../../../@business/service/Flashcard.service';
import { getRequestErrorMessage } from '../../utils/getRequestErrorMessage';
import { FlashcardPractice } from './FlashcardPractice';
type Association = 'subject' | 'topic' | 'subtopic';

export function FlashcardCreator({ journeyId, open, onClose, areas, initialAreaId, initialTopicId }: { journeyId: number; open: boolean; onClose(): void; areas: KnowledgeAreaResponse[]; initialAreaId?: number; initialTopicId?: number }) {
  const [mode, setMode] = useState<'create' | 'practice'>('practice');
  const [model, setModel] = useState('Básico');
  const [type, setType] = useState('Conceito');
  const [association, setAssociation] = useState<Association>('topic');
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [topicIndex, setTopicIndex] = useState(0);
  const [subtopicIndex, setSubtopicIndex] = useState(0);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);
  const [correctAnswer, setCorrectAnswer] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setMode(initialTopicId ? 'create' : 'practice');
    const areaIndex = initialAreaId ? areas.findIndex(area => area.id === initialAreaId) : -1;
    if (areaIndex >= 0) {
      setSubjectIndex(areaIndex);
      const nextTopicIndex = initialTopicId ? areas[areaIndex].nodes.findIndex(topic => topic.id === initialTopicId) : -1;
      setTopicIndex(Math.max(0, nextTopicIndex));
      setAssociation(initialTopicId ? 'topic' : 'subject');
    }
  }, [open, initialAreaId, initialTopicId, areas]);
  if (!open) return null;
  const subject = areas[subjectIndex];
  const topic = subject?.nodes[Math.min(topicIndex, Math.max(0, subject.nodes.length - 1))];
  const subtopic = topic?.children[Math.min(subtopicIndex, Math.max(0, topic.children.length - 1))];
  const save = async () => {
    const front = frontRef.current?.value.trim() ?? '';
    const back = backRef.current?.value.trim() ?? '';
    if (!front.trim() || !back.trim()) return void toast.error('Preencha a frente e o verso do flashcard.');
    if (!subject) return void toast.error('Selecione uma matéria para o flashcard.');
    if (association !== 'subject' && !topic) return void toast.error('Selecione um tópico para o flashcard.');
    if (association === 'subtopic' && !subtopic) return void toast.error('Selecione um subtópico para o flashcard.');
    if (model === 'Verdadeiro ou falso' && correctAnswer == null) return void toast.error('Informe se a afirmação é verdadeira ou falsa.');
    if (model === 'Omissão de palavras' && (!front.includes('{{') || !front.includes('}}'))) return void toast.error('Marque a palavra omitida entre chaves duplas: {{exemplo}}.');

    setSaving(true);
    try {
      await flashcardService.register({
        journeyId,
        knowledgeAreaId: subject.id,
        syllabusNodeId: association === 'subject' ? null : association === 'topic' ? topic!.id : subtopic!.id,
        model,
        type,
        front,
        back,
        correctAnswer: model === 'Verdadeiro ou falso' ? correctAnswer : null,
      });
      toast.success('Flashcard criado com sucesso!');
      if (frontRef.current) frontRef.current.value = '';
      if (backRef.current) backRef.current.value = '';
      onClose();
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Não foi possível criar o flashcard.'));
    } finally {
      setSaving(false);
    }
  };
  return <div className="fc-create-overlay" onMouseDown={onClose}><section className="fc-create-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fc-create-title">
    <header><div><span>FLASHCARDS</span><h2 id="fc-create-title">{mode === 'create' ? 'Criar novo flashcard' : 'Praticar flashcards'}</h2><p>{mode === 'create' ? 'Monte o cartão e associe-o ao conteúdo do edital.' : 'Escolha todo o conteúdo ou filtre sua sessão de prática.'}</p></div><button onClick={onClose} aria-label="Fechar">×</button></header>
    <div className="fc-create-body">
      <div className="fc-mode-tabs"><button className={mode === 'practice' ? 'active' : ''} onClick={() => setMode('practice')}>▷ Praticar</button><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>＋ Criar</button></div>
      {mode === 'create' ? <>
      <section><label>Modelo</label><div className="fc-choice-grid">{['Básico', 'Omissão de palavras', 'Verdadeiro ou falso'].map(item => <button className={model === item ? 'selected' : ''} onClick={() => setModel(item)} key={item}><strong>{item}</strong><small>{item === 'Básico' ? 'Frente e verso' : item === 'Omissão de palavras' ? 'Complete a lacuna' : 'Julgue a afirmação'}</small></button>)}</div></section>
      {model === 'Verdadeiro ou falso' && <section><label>Resposta correta</label><div className="fc-type-row"><button className={correctAnswer === true ? 'selected' : ''} onClick={() => setCorrectAnswer(true)}>Verdadeiro</button><button className={correctAnswer === false ? 'selected' : ''} onClick={() => setCorrectAnswer(false)}>Falso</button></div></section>}
      <section><label>Tipo</label><div className="fc-type-row">{['Conceito', 'Lei seca', 'Questão', 'Jurisprudência'].map(item => <button className={type === item ? 'selected' : ''} onClick={() => setType(item)} key={item}>{item}</button>)}</div></section>
      <section><label>Associar a</label>{areas.length ? <><div className="fc-type-row">{([['subject','Matéria'],['topic','Tópico'],['subtopic','Subtópico']] as const).map(([value,label]) => <button type="button" className={association === value ? 'selected' : ''} onClick={() => setAssociation(value)} key={value}>{label}</button>)}</div><div className="fc-association-fields"><label><span>Matéria</span><select value={subjectIndex} onChange={event => { setSubjectIndex(Number(event.target.value)); setTopicIndex(0); setSubtopicIndex(0); }}>{areas.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>{association !== 'subject' && <label><span>Tópico</span><select value={topicIndex} onChange={event => { setTopicIndex(Number(event.target.value)); setSubtopicIndex(0); }} disabled={!subject?.nodes.length}>{subject?.nodes.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>}{association === 'subtopic' && <label><span>Subtópico</span><select value={subtopicIndex} onChange={event => setSubtopicIndex(Number(event.target.value))} disabled={!topic?.children.length}>{topic?.children.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>}</div></> : <p className="fc-association-empty">Nenhum conteúdo cadastrado nesta jornada.</p>}</section>
      <section className="fc-card-fields"><label>Conteúdo do cartão</label><input ref={frontRef} placeholder={model === 'Verdadeiro ou falso' ? 'Digite a afirmação' : model === 'Omissão de palavras' ? 'Ex.: O prazo é de {{cinco dias}}' : 'Frente ou pergunta'}/>{model === 'Omissão de palavras' && <small className="fc-field-help">Coloque o trecho que deverá ser ocultado entre chaves duplas.</small>}<textarea ref={backRef} placeholder={model === 'Verdadeiro ou falso' ? 'Justificativa da resposta' : model === 'Omissão de palavras' ? 'Explicação complementar' : 'Verso ou resposta'} rows={4}/></section>
      </> : <FlashcardPractice journeyId={journeyId} areas={areas} onClose={onClose} />}
    </div>
    {mode === 'create' && <footer><span>O flashcard será salvo nesta jornada</span><div><button onClick={onClose} disabled={saving}>Cancelar</button><button className="filled-button" disabled={saving} onClick={save}>{saving ? 'Criando…' : 'Criar flashcard'}</button></div></footer>}
  </section></div>;
}
