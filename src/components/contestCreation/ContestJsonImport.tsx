import { useEffect, useRef, useState } from 'react';
import type { Subject } from './ContestCreationDrawer';

type Props = { onImport(subjects: Subject[]): void };
const compact = (value: string, limit: number) => value.length <= limit ? value : `${value.slice(0, limit - 1).trim()}…`;
function titleOf(value: unknown, limit: number) {
  if (typeof value === 'string') return compact(value.trim(), limit);
  if (!value || typeof value !== 'object') return '';
  const item = value as Record<string, unknown>;
  return compact(String(item.nome ?? item.title ?? item.titulo ?? '').trim(), limit);
}
function parse(value: string): Subject[] {
  const clean = value.replace(/^\uFEFF/, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(clean) as Record<string, unknown> | unknown[];
  const root = Array.isArray(parsed) ? parsed : parsed.materias ?? parsed.disciplinas ?? parsed.areas ?? (parsed.data as Record<string, unknown> | undefined)?.materias;
  const list = Array.isArray(root) ? root : root && typeof root === 'object' ? Object.entries(root).map(([nome, topicos]) => ({ nome, topicos })) : null;
  if (!list) throw new Error('Não encontrei uma lista “materias” ou “disciplinas”.');
  const subjects = list.map(item => { const record = typeof item === 'object' && item ? item as Record<string, unknown> : {}; const nodes = record.topicos ?? record.topics ?? record.conteudos ?? record.itens; return { name: titleOf(item, 180), topics: Array.isArray(nodes) ? nodes.map(node => { const data = typeof node === 'object' && node ? node as Record<string, unknown> : {}; const children = data.subtopicos ?? data.subtopics ?? data.children ?? data.itens; return { name: titleOf(node, 300), subtopics: Array.isArray(children) ? children.map(child => titleOf(child, 300)).filter(Boolean) : [] }; }).filter(topic => topic.name) : [] }; }).filter(item => item.name);
  if (!subjects.length) throw new Error('Nenhuma disciplina válida foi encontrada.');
  return subjects;
}
export function ContestJsonImport({ onImport }: Props) {
  const [value, setValue] = useState(''); const [message, setMessage] = useState('');
  const onImportRef = useRef(onImport);
  useEffect(() => { onImportRef.current = onImport; }, [onImport]);
  useEffect(() => {
    if (!value.trim()) { setMessage(''); return; }
    const timeout = window.setTimeout(() => {
      try { const subjects = parse(value); onImportRef.current(subjects); setMessage(`${subjects.length} disciplinas importadas e combinadas.`); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'JSON inválido.'); }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [value]);
  async function file(selected?: File) { if (selected) setValue(await selected.text()); }
  return <section className="contest-json-import"><header><div><span>⇩</span><div><strong>Importar conteúdo</strong><small>O conteúdo será somado ao que já foi informado.</small></div></div><label>Importar JSON<input type="file" accept=".json,application/json" onChange={event => file(event.target.files?.[0])}/></label></header><textarea value={value} onChange={event => { setValue(event.target.value); setMessage(''); }} placeholder={'{\n  "materias": [{ "nome": "Português", "topicos": [] }]\n}'}/>{message && <p className={message.includes('combinadas') ? 'success' : 'error'}>{message}</p>}</section>;
}
