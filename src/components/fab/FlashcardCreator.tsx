import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { KnowledgeAreaResponse } from '../../../@business/dto/response/journey.response';
type Association = 'subject' | 'topic' | 'subtopic';

export function FlashcardCreator({ open, onClose, areas, initialAreaId, initialTopicId }: { open: boolean; onClose(): void; areas: KnowledgeAreaResponse[]; initialAreaId?: number; initialTopicId?: number }) {
  const [mode, setMode] = useState<'create' | 'practice'>('practice');
  const [model, setModel] = useState('Básico');
  const [type, setType] = useState('Conceito');
  const [association, setAssociation] = useState<Association>('topic');
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [topicIndex, setTopicIndex] = useState(0);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [practiceScope, setPracticeScope] = useState<'all' | Association>('all');
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
  const topicCount = areas.reduce((total, area) => total + area.nodes.length, 0);
  const subtopicCount = areas.reduce((total, area) => total + area.nodes.reduce((sum, node) => sum + node.children.length, 0), 0);
  const totalCards = Math.max(24, areas.length * 18 + topicCount * 5 + subtopicCount * 2);
  const reviewCards = Math.max(4, Math.round(totalCards * .23));
  const newCards = Math.max(3, Math.round(totalCards * .12));
  const correctToday = 18 + areas.length * 2;
  const save = () => { if (!front.trim() || !back.trim()) return void toast.error('Preencha a frente e o verso do flashcard.'); toast.success('Flashcard criado em modo de demonstração!'); setFront(''); setBack(''); onClose(); };
  const startPractice = () => { if (!areas.length) return void toast.error('Esta jornada ainda não possui conteúdo.'); toast.success('Sessão de flashcards iniciada em modo de demonstração!'); onClose(); };
  return <div className="fc-create-overlay" onMouseDown={onClose}><section className="fc-create-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fc-create-title">
    <header><div><span>FLASHCARDS</span><h2 id="fc-create-title">{mode === 'create' ? 'Criar novo flashcard' : 'Praticar flashcards'}</h2><p>{mode === 'create' ? 'Monte o cartão e associe-o ao conteúdo do edital.' : 'Escolha todo o conteúdo ou filtre sua sessão de prática.'}</p></div><button onClick={onClose} aria-label="Fechar">×</button></header>
    <div className="fc-create-body">
      <div className="fc-mode-tabs"><button className={mode === 'practice' ? 'active' : ''} onClick={() => setMode('practice')}>▷ Praticar</button><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>＋ Criar</button></div>
      {mode === 'create' ? <>
      <section><label>Modelo</label><div className="fc-choice-grid">{['Básico', 'Omissão de palavras', 'Verdadeiro ou falso'].map(item => <button className={model === item ? 'selected' : ''} onClick={() => setModel(item)} key={item}><strong>{item}</strong><small>{item === 'Básico' ? 'Frente e verso' : item === 'Omissão de palavras' ? 'Complete a lacuna' : 'Julgue a afirmação'}</small></button>)}</div></section>
      <section><label>Tipo</label><div className="fc-type-row">{['Conceito', 'Lei seca', 'Questão', 'Jurisprudência'].map(item => <button className={type === item ? 'selected' : ''} onClick={() => setType(item)} key={item}>{item}</button>)}</div></section>
      <section><label>Associar a</label>{areas.length ? <><div className="fc-type-row">{([['subject','Matéria'],['topic','Tópico'],['subtopic','Subtópico']] as const).map(([value,label]) => <button className={association === value ? 'selected' : ''} onClick={() => setAssociation(value)} key={value}>{label}</button>)}</div><div className="fc-association-fields"><label><span>Matéria</span><select value={subjectIndex} onChange={event => { setSubjectIndex(Number(event.target.value)); setTopicIndex(0); }}>{areas.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>{association !== 'subject' && <label><span>Tópico</span><select value={topicIndex} onChange={event => setTopicIndex(Number(event.target.value))} disabled={!subject?.nodes.length}>{subject?.nodes.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>}{association === 'subtopic' && <label><span>Subtópico</span><select disabled={!topic?.children.length}>{topic?.children.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}</div></> : <p className="fc-association-empty">Nenhum conteúdo cadastrado nesta jornada.</p>}</section>
      <section className="fc-card-fields"><label>Conteúdo do cartão</label><input value={front} onChange={event => setFront(event.target.value)} placeholder={model === 'Verdadeiro ou falso' ? 'Digite a afirmação' : 'Frente ou pergunta'}/><textarea value={back} onChange={event => setBack(event.target.value)} placeholder={model === 'Verdadeiro ou falso' ? 'Justificativa da resposta' : 'Verso ou resposta'} rows={4}/></section>
      </> : <section className="fc-practice"><div className="fc-stats"><article><strong>{totalCards}</strong><small>Total de cards</small></article><article><strong>{reviewCards}</strong><small>Para revisar</small></article><article><strong>{newCards}</strong><small>Novos</small></article><article><strong>{correctToday}</strong><small>Acertos hoje</small></article></div><label>O que deseja praticar?</label><div className="fc-practice-scopes">{([['all','Todos os flashcards'],['subject','Por matéria'],['topic','Por tópico'],['subtopic','Por subtópico']] as const).map(([value,label]) => <button className={practiceScope === value ? 'selected' : ''} onClick={() => setPracticeScope(value)} key={value}><strong>{label}</strong><small>{value === 'all' ? `${totalCards} cards disponíveis` : 'Selecionar em cascata'}</small></button>)}</div>{practiceScope !== 'all' && areas.length ? <div className="fc-association-fields"><label><span>Matéria</span><select value={subjectIndex} onChange={event => { setSubjectIndex(Number(event.target.value)); setTopicIndex(0); }}>{areas.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>{practiceScope !== 'subject' && <label><span>Tópico</span><select value={topicIndex} onChange={event => setTopicIndex(Number(event.target.value))} disabled={!subject?.nodes.length}>{subject?.nodes.map((item,index) => <option value={index} key={item.id}>{item.title}</option>)}</select></label>}{practiceScope === 'subtopic' && <label><span>Subtópico</span><select disabled={!topic?.children.length}>{topic?.children.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}</div> : practiceScope !== 'all' && <p className="fc-association-empty">Nenhum conteúdo cadastrado nesta jornada.</p>}<div className="fc-practice-summary"><span>SESSÃO PREPARADA</span><strong>{practiceScope === 'all' ? reviewCards + newCards : Math.max(5, Math.round((reviewCards + newCards) / Math.max(1, areas.length)))} cards</strong><small>Inclui revisões pendentes e cartões novos.</small></div></section>}
    </div>
    <footer><span>Modo demonstração · dados não serão enviados</span><div><button onClick={onClose}>Cancelar</button><button className="filled-button" onClick={mode === 'create' ? save : startPractice}>{mode === 'create' ? 'Criar flashcard' : 'Iniciar prática'}</button></div></footer>
  </section></div>;
}
