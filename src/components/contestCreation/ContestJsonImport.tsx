import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Subject } from './ContestCreationDrawer';

type Props = { onImport(subjects: Subject[]): void };
const EDITAL_AI_PROMPT = `Converta o edital abaixo para JSON valido neste formato:

{
  "materias": [
    {
      "id": "mat_001",
      "nome": "Nome da Materia",
      "topicos": [
        {
          "id": "top_001",
          "nome": "Nome do Topico",
          "subtopicos": []
        }
      ]
    }
  ]
}

Regras:
- Retorne apenas JSON, sem Markdown ou explicacoes.
- Preserve 100% do conteudo do edital. Nao resuma, nao omita, nao agrupe itens para encurtar.
- Preserve a ordem e a hierarquia materia -> topico -> subtopico.
- Remova numeracao e rotulos como "TOPICO 01 -"; o nome deve ficar limpo.
- Use IDs sequenciais: mat_001, top_001, sub_001.
- Nao adicione campos extras.
- Use "subtopicos": [] quando o topico for uma unidade unica.
- Nunca crie subtopico unico repetindo o nome do topico.
- Nao divida automaticamente por virgula ou "e". So crie subtopicos quando forem assuntos claramente independentes para estudar separadamente.
- Divida por ponto e virgula quando houver lista de normas, leis, decretos, resolucoes, portarias, artigos ou atos numerados.
- Em listas de normas, mantenha o contexto no topico e crie um subtopico para cada item da lista, sem deixar nenhum item de fora.
- Em listas de normas, prefixe cada item com o tipo do ato quando o contexto estiver no topico. Exemplo: "Resolucoes do CONTRAN: 04/1998; 14/1998" -> "Resolucao CONTRAN 04/1998", "Resolucao CONTRAN 14/1998".
- Preserve observacoes de cada item, como "exceto os anexos", "exceto as fichas" ou "Anexo I", no subtopico correspondente.
- Nao separe expressoes integradas como "Compreensao e interpretacao de textos", "Reescrita de frases e paragrafos", "Microfilmagem e preservacao", "Gestao e avaliacao do desempenho".
- Pode separar quando forem blocos autonomos, como "Hardware e Software", "Word, Excel e Power Point", "Governanca, Governabilidade e Accountability".
- Ao separar pares com termo compartilhado, complete o nome: "Regencia Nominal e Verbal" -> "Regencia Nominal", "Regencia Verbal".

[Cole o edital abaixo]`;
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
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(EDITAL_AI_PROMPT);
      toast.success('Prompt copiado! Agora cole o edital abaixo dele na sua IA.');
    } catch {
      toast.error('Não foi possível copiar o prompt. Selecione o texto e copie manualmente.');
    }
  }
  return <section className="contest-json-import">
    <header>
      <div><span>⇩</span><div><strong>Importar conteúdo</strong><small>O conteúdo será somado ao que já foi informado.</small></div></div>
      <label>Importar JSON<input type="file" accept=".json,application/json" onChange={event => file(event.target.files?.[0])}/></label>
    </header>
    <div className="contest-json-guide">
      <strong>Transforme seu edital em JSON com uma IA</strong>
      <ol>
        <li>Baixe o edital no site oficial da banca e copie todo o conteúdo programático.</li>
        <li>Copie o prompt abaixo e envie para a IA de sua preferência.</li>
        <li>Cole o conteúdo do edital no lugar indicado ao final do prompt.</li>
        <li>Copie somente o JSON gerado pela IA e cole no campo de importação abaixo.</li>
      </ol>
      <div className="contest-json-prompt-heading"><span>Prompt para gerar o JSON</span><button type="button" onClick={copyPrompt}>Copiar prompt</button></div>
      <textarea className="contest-json-prompt" value={EDITAL_AI_PROMPT} readOnly aria-label="Prompt para converter edital em JSON" />
    </div>
    <div className="contest-json-result-heading"><strong>Cole aqui o JSON gerado</strong><small>Ou use o botão “Importar JSON” acima se você salvou o arquivo.</small></div>
    <textarea className="contest-json-result" value={value} onChange={event => { setValue(event.target.value); setMessage(''); }} placeholder={'{\n  "materias": [{ "nome": "Português", "topicos": [] }]\n}'}/>
    {message && <p className={message.includes('combinadas') ? 'success' : 'error'}>{message}</p>}
  </section>;
}
