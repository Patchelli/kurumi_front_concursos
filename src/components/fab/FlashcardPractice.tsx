import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { KnowledgeAreaResponse } from '../../../@business/dto/response/journey.response';
import { flashcardService, type FlashcardPracticeResponse, type FlashcardResponse } from '../../../@business/service/Flashcard.service';
import { getRequestErrorMessage } from '../../utils/getRequestErrorMessage';
import { notifyTimeCapsuleProgressChanged } from '../../../@business/service/TimeCapsule.service';

type Scope = 'all' | 'subject' | 'topic' | 'subtopic';
const empty: FlashcardPracticeResponse = { totalCards: 0, reviewCards: 0, newCards: 0, correctToday: 0, cards: [] };

function question(card: FlashcardResponse, revealed: boolean) {
  if (card.model !== 'Omissão de palavras') return card.front;
  return revealed ? card.front.replace(/\{\{(.+?)\}\}/g, '$1') : card.front.replace(/\{\{(.+?)\}\}/g, '________');
}

export function FlashcardPractice({ journeyId, areas, onClose }: { journeyId: number; areas: KnowledgeAreaResponse[]; onClose(): void }) {
  const [scope, setScope] = useState<Scope>('all');
  const [areaIndex, setAreaIndex] = useState(0);
  const [topicIndex, setTopicIndex] = useState(0);
  const [subtopicIndex, setSubtopicIndex] = useState(0);
  const [data, setData] = useState<FlashcardPracticeResponse>(empty);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [trueFalseChoice, setTrueFalseChoice] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(0);
  const [remembered, setRemembered] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const area = areas[areaIndex];
  const topic = area?.nodes[topicIndex];
  const subtopic = topic?.children[subtopicIndex];

  const load = useCallback(async (currentScope: Scope, currentArea?: typeof area, currentTopic?: typeof topic, currentSubtopic?: typeof subtopic) => {
    if ((currentScope === 'topic' && !currentTopic) || (currentScope === 'subtopic' && !currentSubtopic)) {
      setData(empty);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params = {
        journeyId,
        ...(currentScope !== 'all' && currentArea ? { knowledgeAreaId: currentArea.id } : {}),
        ...(currentScope === 'topic' && currentTopic ? { syllabusNodeId: currentTopic.id, includeDescendants: true } : {}),
        ...(currentScope === 'subtopic' && currentSubtopic ? { syllabusNodeId: currentSubtopic.id } : {}),
      };
      const result = await flashcardService.practice(params);
      if (!controller.signal.aborted) setData(result);
    } catch (error) {
      if (!controller.signal.aborted) toast.error(getRequestErrorMessage(error, 'Não foi possível carregar os flashcards.'));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    if (!started) void load(scope, area, topic, subtopic);
    return () => { abortRef.current?.abort(); };
  }, [scope, areaIndex, topicIndex, subtopicIndex, started, load]);

  const card = data.cards[index];
  const start = () => {
    if (!data.cards.length) return void toast.info('Não há flashcards novos ou pendentes para este filtro.');
    setIndex(0); setAnswered(0); setRemembered(0); setRevealed(false); setTrueFalseChoice(null); setStarted(true);
  };
  const grade = async (value: 1 | 2 | 3 | 4) => {
    if (!card) return;
    try {
      await flashcardService.recall(card.id, value);
      notifyTimeCapsuleProgressChanged();
      setAnswered(current => current + 1);
      if (value >= 3) setRemembered(current => current + 1);
      setIndex(current => current + 1);
      setRevealed(false);
      setTrueFalseChoice(null);
    } catch (error) { toast.error(getRequestErrorMessage(error, 'Não foi possível registrar sua resposta.')); }
  };

  if (started && index >= data.cards.length) return <section className="fc-session-finished"><span>SESSÃO CONCLUÍDA</span><strong>{remembered} de {answered} lembrados</strong><small>As próximas revisões foram agendadas conforme suas respostas.</small><div><button onClick={() => { setStarted(false); void load(scope, area, topic, subtopic); }}>Nova sessão</button><button className="filled-button" onClick={onClose}>Concluir</button></div></section>;

  if (started && card) {
    const isTrueFalse = card.model === 'Verdadeiro ou falso';
    const choiceCorrect = card.correctAnswer != null && trueFalseChoice === card.correctAnswer;
    return <section className="fc-session">
      <div className="fc-session-progress"><span>Card {index + 1} de {data.cards.length}</span><i><b style={{ width: `${index / data.cards.length * 100}%` }}/></i><small>{card.type} · {card.model}</small></div>
      <article className="fc-session-card"><span>{revealed ? 'RESPOSTA' : isTrueFalse ? 'JULGUE A AFIRMAÇÃO' : card.model === 'Omissão de palavras' ? 'COMPLETE A LACUNA' : 'PERGUNTA'}</span><strong>{question(card, revealed)}</strong>
        {isTrueFalse && !revealed && <div className="fc-true-false"><button className={trueFalseChoice === true ? 'selected' : ''} onClick={() => setTrueFalseChoice(true)}>Verdadeiro</button><button className={trueFalseChoice === false ? 'selected' : ''} onClick={() => setTrueFalseChoice(false)}>Falso</button></div>}
        {revealed && <div className="fc-session-answer">{isTrueFalse && card.correctAnswer != null && <em className={choiceCorrect ? 'correct' : 'wrong'}>{choiceCorrect ? 'Você acertou' : `Resposta: ${card.correctAnswer ? 'Verdadeiro' : 'Falso'}`}</em>}<p>{card.back}</p></div>}
      </article>
      {!revealed ? <button className="fc-reveal" disabled={isTrueFalse && trueFalseChoice == null} onClick={() => setRevealed(true)}>{isTrueFalse ? 'Confirmar resposta' : 'Mostrar resposta'}</button> : <div className="fc-grades"><span>Como foi lembrar?</span><div><button onClick={() => void grade(1)}>De novo<small>1 dia</small></button><button onClick={() => void grade(2)}>Difícil<small>intervalo curto</small></button><button onClick={() => void grade(3)}>Bom<small>intervalo normal</small></button><button onClick={() => void grade(4)}>Fácil<small>intervalo maior</small></button></div></div>}
    </section>;
  }

  return <section className="fc-practice">
    <div className="fc-stats"><article><strong>{data.totalCards}</strong><small>Total de cards</small></article><article><strong>{data.reviewCards}</strong><small>Para revisar</small></article><article><strong>{data.newCards}</strong><small>Novos</small></article><article><strong>{data.correctToday}</strong><small>Acertos hoje</small></article></div>

    <div className="fc-practice-section">
      <label>O que deseja praticar?</label>
      <div className="fc-practice-scopes">{([['all','Todos os flashcards'],['subject','Por matéria'],['topic','Por tópico'],['subtopic','Por subtópico']] as const).map(([value,label]) => <button className={scope === value ? 'selected' : ''} onClick={() => setScope(value)} key={value}><strong>{label}</strong><small>{value === 'all' ? `${data.totalCards} cards cadastrados` : 'Selecionar em cascata'}</small></button>)}</div>
    </div>

    {scope !== 'all' && areas.length > 0 && <div className="fc-association-fields"><label><span>Matéria</span><select value={areaIndex} onChange={event => { setAreaIndex(Number(event.target.value)); setTopicIndex(0); setSubtopicIndex(0); }}>{areas.map((item,i) => <option value={i} key={item.id}>{item.title}</option>)}</select></label>{scope !== 'subject' && <label><span>Tópico</span><select value={topicIndex} onChange={event => { setTopicIndex(Number(event.target.value)); setSubtopicIndex(0); }}>{area?.nodes.map((item,i) => <option value={i} key={item.id}>{item.title}</option>)}</select></label>}{scope === 'subtopic' && <label><span>Subtópico</span><select value={subtopicIndex} onChange={event => setSubtopicIndex(Number(event.target.value))}>{topic?.children.map((item,i) => <option value={i} key={item.id}>{item.title}</option>)}</select></label>}</div>}

    <div className="fc-practice-footer">
      <div className="fc-practice-summary"><span>SESSÃO PREPARADA</span><strong>{loading ? 'Carregando…' : `${data.cards.length} cards`}</strong><small>Revisões pendentes primeiro, seguidas por cartões novos.</small></div>
      <button className="fc-start-practice" disabled={loading || !data.cards.length} onClick={start}>Iniciar prática</button>
    </div>
  </section>;
}
