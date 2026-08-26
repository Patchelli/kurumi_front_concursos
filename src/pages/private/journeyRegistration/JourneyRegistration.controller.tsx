import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import { journeyService } from '../../../../@business/service/Journey.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { JourneyRegistrationView } from './JourneyRegistration.view';
import type { JourneyRegistrationForm, SyllabusAreaDraft, SyllabusNodeDraft } from './JourneyRegistration.type';

const initialForm: JourneyRegistrationForm = { title: '', institution: '', examBoard: '', position: '', openings: '', stage: EJourneyStage.PreNotice, examDate: '', syllabusMode: 'manual', areas: [], includeInStatistics: true };

function readTitle(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const item = value as Record<string, unknown>;
  return String(item.nome ?? item.title ?? item.titulo ?? '').trim();
}

function compactTitle(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trim()}…`;
}

function readNodes(value: unknown): SyllabusNodeDraft[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    const record = typeof item === 'object' && item ? item as Record<string, unknown> : {};
    const title = compactTitle(readTitle(item), 180);
    return { title, children: readNodes(record.subtopicos ?? record.children ?? record.subtopics ?? record.itens) };
  }).filter(item => item.title);
}

function parseSyllabus(value: string): SyllabusAreaDraft[] {
  const clean = value.replace(/^\uFEFF/, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(clean) as Record<string, unknown> | unknown[];
  const root = Array.isArray(parsed) ? parsed : parsed.materias ?? parsed.areas ?? parsed.disciplinas ?? (parsed.data as Record<string, unknown> | undefined)?.materias;
  const source = Array.isArray(root) ? root : root && typeof root === 'object' ? Object.entries(root).map(([nome, topicos]) => ({ nome, topicos })) : null;
  if (!source) throw new Error('Não encontrei as disciplinas. Use uma lista "materias" ou "disciplinas" no JSON.');
  const areas = source.map(item => {
    const record = typeof item === 'object' && item ? item as Record<string, unknown> : {};
    const title = compactTitle(readTitle(item), 120);
    return { title, topics: readNodes(record.topicos ?? record.topics ?? record.nodes ?? record.conteudos ?? record.itens) };
  }).filter(item => item.title);
  if (!areas.length) throw new Error('Nenhuma matéria válida foi encontrada no JSON.');
  return areas;
}

export function JourneyRegistrationController() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [areaDraft, setAreaDraft] = useState('');
  const [jsonDraft, setJsonDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function next() {
    setError('');
    if (step === 1 && !form.intent) return setError('Escolha o ponto de partida da jornada.');
    if (step === 2 && form.title.trim().length < 3) return setError('Informe um nome com pelo menos três caracteres.');
    if (step === 2 && form.intent === 'completed') return setStep(4);
    if (step === 3 && form.stage === EJourneyStage.PostNotice && !form.examDate) return setError('Informe a data da prova ou escolha pré-edital.');
    if (step === 4) {
      const invalidArea = form.areas.find(area => area.title.length > 120);
      const invalidNode = form.areas.flatMap(area => area.topics.flatMap(topic => [topic, ...topic.children])).find(node => node.title.length > 180);
      if (invalidArea || invalidNode) return setError('Há um título muito longo no edital. Resuma o item indicado antes de continuar.');
    }
    setStep(current => Math.min(5, current + 1));
  }

  async function submit() {
    setSaving(true); setError('');
    try {
      const journey = await journeyService.register({
        journey: { id: null, title: form.title.trim(), institution: form.institution.trim() || null, examBoard: form.examBoard.trim() || null, position: form.position.trim() || null, salary: null, openings: form.openings ? Number(form.openings) : null, noticeUrl: null, examDate: form.stage === EJourneyStage.PostNotice ? form.examDate : null, stage: form.intent === 'completed' ? EJourneyStage.Completed : form.stage, includeInStatistics: form.includeInStatistics },
        knowledgeAreas: form.areas.map((area, areaOrder) => ({ title: area.title, order: areaOrder, nodes: area.topics.map((topic, topicOrder) => ({ title: topic.title, order: topicOrder, children: topic.children.map((child, childOrder) => ({ title: child.title, order: childOrder, children: [] })) })) }))
      });
      navigate(`/jornadas/${journey.id}`, { replace: true });
    } catch (requestError) { setError(getRequestErrorMessage(requestError, 'Não foi possível concluir o cadastro.')); }
    finally { setSaving(false); }
  }

  function importJson(value?: unknown) {
    const source = typeof value === 'string' ? value : jsonDraft;
    if (!source.trim()) return;
    try { setForm(current => ({ ...current, syllabusMode: 'json', areas: parseSyllabus(source) })); setError(''); }
    catch (parseError) { setError(parseError instanceof Error ? parseError.message : 'JSON inválido.'); }
  }

  return <JourneyRegistrationView step={step} form={form} areaDraft={areaDraft} jsonDraft={jsonDraft} saving={saving} error={error} onBack={() => navigate('/')} onPrevious={() => setStep(current => Math.max(1, current - 1))} onNext={next} onSubmit={submit} onFieldChange={(field, value) => setForm(current => ({ ...current, [field]: value, ...(field === 'stage' && value === EJourneyStage.PreNotice ? { examDate: '' } : {}), ...(field === 'syllabusMode' && value === 'blank' ? { areas: [] } : {}) }))} onAreaDraftChange={setAreaDraft} onJsonDraftChange={setJsonDraft} onImportJson={importJson} onAddArea={() => { const title = areaDraft.trim(); if (!title || form.areas.some(area => area.title.toLocaleLowerCase() === title.toLocaleLowerCase())) return; setForm(current => ({ ...current, syllabusMode: 'manual', areas: [...current.areas, { title, topics: [] }] })); setAreaDraft(''); }} onRemoveArea={index => setForm(current => ({ ...current, areas: current.areas.filter((_, itemIndex) => itemIndex !== index) }))} onAddTopic={areaIndex => { const title = window.prompt('Nome do tópico'); if (!title?.trim()) return; setForm(current => ({ ...current, areas: current.areas.map((area, index) => index === areaIndex ? { ...area, topics: [...area.topics, { title: title.trim(), children: [] }] } : area) })); }} />;
}
