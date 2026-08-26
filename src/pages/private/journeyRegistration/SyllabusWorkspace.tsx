import { useState } from 'react';
import type { JourneyRegistrationViewProps, SyllabusAreaDraft } from './JourneyRegistration.type';


type Props = Pick<JourneyRegistrationViewProps,'form'|'jsonDraft'|'areaDraft'|'onFieldChange'|'onJsonDraftChange'|'onImportJson'|'onAreaDraftChange'|'onAddArea'>;

export function SyllabusWorkspace(props: Props) {
  const [openArea, setOpenArea] = useState<number | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add'|'tree'>('add');
  const update = (areas: SyllabusAreaDraft[]) => props.onFieldChange('areas', areas);
  const ask = (label: string, limit: number) => { const value = window.prompt(label)?.trim(); if (!value) return null; if (value.length > limit) { window.alert(`${label} deve ter no máximo ${limit} caracteres.`); return null; } return value; };
  const addTopic = (areaIndex: number) => { const title = ask('Nome do tópico', 300); if (!title) return; update(props.form.areas.map((area,index) => index === areaIndex ? {...area,topics:[...area.topics,{title,children:[]}]} : area)); setOpenArea(areaIndex); };
  const addSubtopic = (areaIndex: number, topicIndex: number) => { const title = ask('Nome do subtópico', 300); if (!title) return; update(props.form.areas.map((area,index) => index !== areaIndex ? area : {...area,topics:area.topics.map((topic,current) => current === topicIndex ? {...topic,children:[...topic.children,{title,children:[]}]} : topic)})); setOpenTopic(`${areaIndex}-${topicIndex}`); };
  const loadFile = async (file?: File) => { if (!file) return; const value = await file.text(); props.onJsonDraftChange(value); props.onImportJson(value); };

  return <div className="syllabus-workspace">
    <div className="syllabus-tabs">
      <button className={activeTab==='add'?'active':''} onClick={()=>setActiveTab('add')}>Adicionar</button>
      <button className={activeTab==='tree'?'active':''} onClick={()=>setActiveTab('tree')}>Estrutura <span>({props.form.areas.length})</span></button>
    </div>
    <div className={`syllabus-input-column${activeTab==='tree'?' syllabus-tab-hide':''}`}>
      {props.form.syllabusMode === 'json' && <section className="syllabus-source"><div className="source-title"><span>⇩</span><div><strong>Importar JSON</strong><small>Cole o conteúdo ou escolha um arquivo JSON.</small></div></div><label><span>⇧</span> Importar JSON<input type="file" accept=".json,application/json" onChange={event => loadFile(event.target.files?.[0])}/></label><textarea value={props.jsonDraft} onChange={event => { props.onJsonDraftChange(event.target.value); props.onImportJson(event.target.value); }} placeholder="Cole aqui matérias, tópicos e subtópicos" /></section>}
      <div className="area-adder"><div><strong>Nova matéria</strong><small>Você pode complementar o conteúdo importado.</small></div><div><input maxLength={180} value={props.areaDraft} onChange={event => props.onAreaDraftChange(event.target.value)} onKeyDown={event => { if(event.key==='Enter'){event.preventDefault();props.onAddArea();} }} placeholder="Ex.: Direito Constitucional"/><button onClick={props.onAddArea} aria-label="Adicionar matéria">＋</button></div></div>
    </div>
    <section className={`syllabus-tree${activeTab==='add'?' syllabus-tab-hide':''}`}><header><div><strong>Estrutura do edital</strong><small>{props.form.areas.length} matérias carregadas</small></div><span>{props.form.areas.reduce((total,area)=>total+area.topics.length,0)} tópicos</span></header>{!props.form.areas.length&&<div className="tree-empty"><span>☷</span><strong>Nenhuma matéria ainda</strong><small>Importe um JSON ou use “Nova matéria”.</small></div>}{props.form.areas.map((area,areaIndex)=>{const areaOpen=openArea===areaIndex;return <article key={`${area.title}-${areaIndex}`}><div className="tree-area" onClick={()=>{setOpenArea(areaOpen?null:areaIndex);setOpenTopic(null)}}><button className="tree-chevron" aria-label={areaOpen?'Recolher matéria':'Expandir matéria'}>{areaOpen?'⌄':'›'}</button><div><strong>{area.title}</strong><small>{area.topics.length} tópicos</small></div><button className="tree-plus" onClick={event=>{event.stopPropagation();addTopic(areaIndex)}} aria-label={`Adicionar tópico em ${area.title}`}>＋</button></div>{areaOpen&&<div className="tree-topics">{!area.topics.length&&<div className="topic-empty">Use o ＋ da matéria para adicionar o primeiro tópico.</div>}{area.topics.map((topic,topicIndex)=>{const key=`${areaIndex}-${topicIndex}`,topicOpen=openTopic===key;return <div className="tree-topic" key={key}><div onClick={()=>setOpenTopic(topicOpen?null:key)}><button className="tree-chevron">{topicOpen?'⌄':'›'}</button><strong>{topic.title}</strong><small>{topic.children.length}</small><button className="tree-plus" onClick={event=>{event.stopPropagation();addSubtopic(areaIndex,topicIndex)}} aria-label={`Adicionar subtópico em ${topic.title}`}>＋</button></div>{topicOpen&&<ul>{topic.children.map((child,index)=><li key={`${child.title}-${index}`}><span>—</span>{child.title}</li>)}{!topic.children.length&&<li className="empty-node">Nenhum subtópico cadastrado.</li>}</ul>}</div>})}</div>}</article>})}</section>
  </div>;
}
