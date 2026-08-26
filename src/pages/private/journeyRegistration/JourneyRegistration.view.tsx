import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import type { JourneyRegistrationViewProps } from './JourneyRegistration.type';
import { SyllabusWorkspace } from './SyllabusWorkspace';

const milestones = [
  { label: 'Tipo', hint: 'Futuro ou realizado' },
  { label: 'Concurso', hint: 'Informações principais' },
  { label: 'Data da prova', hint: 'Pré ou pós-edital' },
  { label: 'Conteúdo', hint: 'Matérias e tópicos' },
  { label: 'Confirmar', hint: 'Revisar e criar' },
];

export function JourneyRegistrationView(props: JourneyRegistrationViewProps) {
  const initials = props.form.title.trim().slice(0, 2).toUpperCase() || 'SJ';
  const stageLabel = props.form.stage === EJourneyStage.PostNotice ? 'Pós-edital' : 'Pré-edital';

  return (
    <main className="path-page">
      <header className="path-header">
        <button className="path-back" onClick={props.onBack} aria-label="Voltar à Central de Jornadas">←</button>
        <div className="path-brand"><span>S</span><strong>Kurumí</strong></div>
        <span className="path-draft">Rascunho não salvo</span>
      </header>

      <section className="path-hero">
        <div>
          <span className="eyebrow">NOVA JORNADA</span>
          <h1>Cadastre seu concurso.</h1>
          <p>Informe os dados, organize o conteúdo e confira antes de criar.</p>
        </div>
        <span className="path-counter">{String(props.step).padStart(2, '0')} <small>/ 05</small></span>
      </section>

      <nav className="path-map-shell" aria-label="Progresso da criação da jornada">
        <ol className={`path-map ${props.form.intent === 'completed' ? 'completed-flow' : ''}`}>
          {milestones.map((milestone, index) => {
            const number = index + 1;
            const status = props.step === number ? 'current' : props.step > number ? 'done' : '';
            return <li className={status} key={milestone.label}>
              <span className="path-dot">{props.step > number ? '✓' : number}</span>
              <div><strong>{milestone.label}</strong><small>{milestone.hint}</small></div>
            </li>;
          })}
        </ol>
      </nav>

      <div className="path-layout">
        <section className="path-canvas">
          <span className="eyebrow">ETAPA {props.step} · {milestones[props.step - 1].label.toUpperCase()}</span>

          {props.step === 1 && <div className="step-body"><h2>De onde você está partindo?</h2><p>Seu momento muda a forma como a Kurumí vai organizar essa jornada.</p><div className="intent-grid"><button className={props.form.intent === 'future' ? 'selected' : ''} onClick={() => props.onFieldChange('intent', 'future')}><span className="intent-art future">↗</span><strong>Tenho um objetivo pela frente</strong><small>Estou estudando ou aguardando a publicação do edital.</small><i>Planejamento, evolução e revisões</i></button><button className={props.form.intent === 'completed' ? 'selected' : ''} onClick={() => props.onFieldChange('intent', 'completed')}><span className="intent-art completed">✓</span><strong>Essa prova já aconteceu</strong><small>Quero guardar o resultado e aprender com essa experiência.</small><i>Histórico, memória e comparação</i></button></div></div>}

          {props.step === 2 && <div className="step-body"><h2>Dê um destino para o caminho.</h2><p>Informe somente o que você já sabe. Tudo poderá ser ajustado depois.</p><div className="wizard-form"><label><span>Nome da jornada *</span><input value={props.form.title} onChange={event => props.onFieldChange('title', event.target.value)} placeholder="Ex.: Auditor TCU 2027" autoFocus /></label><div className="wizard-grid"><label><span>Órgão</span><input value={props.form.institution} onChange={event => props.onFieldChange('institution', event.target.value)} placeholder="Tribunal de Contas da União" /></label><label><span>Banca</span><input value={props.form.examBoard} onChange={event => props.onFieldChange('examBoard', event.target.value)} placeholder="Cebraspe" /></label></div><div className="wizard-grid"><label><span>Cargo ou área</span><input value={props.form.position} onChange={event => props.onFieldChange('position', event.target.value)} placeholder="Auditor Federal" /></label><label><span>Número de vagas</span><input type="number" min="0" value={props.form.openings} onChange={event => props.onFieldChange('openings', event.target.value)} placeholder="Ex.: 25" /></label></div></div></div>}

          {props.step === 3 && <div className="step-body"><h2>Até onde conseguimos enxergar?</h2><p>Se ainda não existe edital, a data da prova não entra no seu planejamento.</p><div className="horizon-choice"><button className={props.form.stage === EJourneyStage.PreNotice ? 'selected' : ''} onClick={() => props.onFieldChange('stage', EJourneyStage.PreNotice)}><span>○</span><strong>Pré-edital</strong><small>Ritmo sustentável, sem contagem regressiva.</small></button><button className={props.form.stage === EJourneyStage.PostNotice ? 'selected' : ''} onClick={() => props.onFieldChange('stage', EJourneyStage.PostNotice)}><span>◉</span><strong>Pós-edital</strong><small>Estratégia guiada pela data oficial.</small></button></div>{props.form.stage === EJourneyStage.PostNotice && <label className="exam-date"><span>Data oficial da prova</span><input type="date" value={props.form.examDate} onChange={event => props.onFieldChange('examDate', event.target.value)} /></label>}</div>}

          {props.step === 4 && <div className="step-body"><h2>Monte o mapa do edital.</h2><p>Escolha a entrada mais prática. A estrutura aparece abaixo para conferência antes de salvar.</p><div className="syllabus-modes syllabus-modes-three"><button className={props.form.syllabusMode === 'blank' ? 'selected' : ''} onClick={() => props.onFieldChange('syllabusMode', 'blank')}><strong>Começar em branco</strong><small>Organizar dentro da jornada.</small></button><button className={props.form.syllabusMode === 'manual' ? 'selected' : ''} onClick={() => props.onFieldChange('syllabusMode', 'manual')}><strong>Adicionar manualmente</strong><small>Melhor para editais menores.</small></button><button className={props.form.syllabusMode === 'json' ? 'selected' : ''} onClick={() => props.onFieldChange('syllabusMode', 'json')}><strong>Importar estrutura</strong><small>Colar um JSON de matérias e tópicos.</small></button></div>{props.form.syllabusMode === 'json' && <div className="json-import"><header><div><strong>Importação inteligente</strong><small>Aceita matérias, tópicos e subtópicos.</small></div><button onClick={props.onImportJson}>Validar e visualizar</button></header><textarea value={props.jsonDraft} onChange={event => props.onJsonDraftChange(event.target.value)} placeholder={'{\n  "materias": [{\n    "nome": "Português",\n    "topicos": [{ "nome": "Interpretação de textos" }]\n  }]\n}'} /></div>}{props.form.syllabusMode === 'manual' && <div className="subject-builder"><div><input value={props.areaDraft} onChange={event => props.onAreaDraftChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); props.onAddArea(); } }} placeholder="Ex.: Direito Constitucional" /><button onClick={props.onAddArea}>Adicionar matéria</button></div></div>}{props.form.areas.length > 0 && <div className="syllabus-review"><header><div><strong>{props.form.areas.length} matérias encontradas</strong><small>{props.form.areas.reduce((total, area) => total + area.topics.length, 0)} tópicos principais</small></div><span>Revise antes de avançar</span></header><ol>{props.form.areas.map((area, index) => <li key={`${area.title}-${index}`}><span className="area-order">{String(index + 1).padStart(2, '0')}</span><div><strong>{area.title}</strong><small>{area.topics.length ? area.topics.map(topic => topic.title).slice(0, 3).join(' · ') : 'Nenhum tópico adicionado'}</small></div><span className="topic-count">{area.topics.length} tópicos</span><button onClick={() => props.onAddTopic(index)} title="Adicionar tópico">＋</button><button onClick={() => props.onRemoveArea(index)} aria-label={`Remover ${area.title}`}>×</button></li>)}</ol></div>}</div>}

          {props.step === 5 && <div className="step-body"><h2>Seu ponto de partida está pronto.</h2><p>Confira o resumo. Ao confirmar, abriremos o painel desta jornada.</p><div className="review-card"><div className="review-heading"><span>{initials}</span><div><h3>{props.form.title}</h3><p>{props.form.institution || 'Órgão não informado'} · {props.form.position || 'Cargo não informado'}</p></div></div><dl><div><dt>Direção</dt><dd>{props.form.intent === 'completed' ? 'Prova realizada' : 'Objetivo futuro'}</dd></div><div><dt>Horizonte</dt><dd>{stageLabel}</dd></div>{props.form.stage === EJourneyStage.PostNotice && <div><dt>Data da prova</dt><dd>{props.form.examDate.split('-').reverse().join('/')}</dd></div>}<div><dt>Conteúdo</dt><dd>{props.form.areas.length ? `${props.form.areas.length} matérias e ${props.form.areas.reduce((total, area) => total + area.topics.length, 0)} tópicos` : 'Será montado depois'}</dd></div></dl>{props.form.areas.length > 0 && <div className="review-subjects">{props.form.areas.map(area => <span key={area.title}>{area.title}</span>)}</div>}<label className="statistics-choice"><input type="checkbox" checked={props.form.includeInStatistics} onChange={event => props.onFieldChange('includeInStatistics', event.target.checked)} /><span><strong>Incluir nas estatísticas gerais</strong><small>Horas, questões e acertos desta jornada entrarão na sua visão global.</small></span></label></div></div>}

          {props.step === 4 && <SyllabusWorkspace {...props} />}
          {props.error && <div className="wizard-error" role="alert">{props.error}</div>}
          <footer className="wizard-actions">
            {props.step > 1 && <button className="wizard-secondary" onClick={props.onPrevious}>Voltar</button>}
            <button className="filled-button" onClick={props.step === 5 ? props.onSubmit : props.onNext} disabled={props.saving}>{props.saving ? 'Salvando…' : props.step === 5 ? 'Criar jornada' : 'Continuar →'}</button>
          </footer>
        </section>

        <aside className="path-context">
          <span className="eyebrow">VISÃO DO CAMINHO</span>
          <div className="path-orbit"><span>{initials}</span></div>
          <h3>{props.form.title || 'Uma jornada sem nome'}</h3>
          <p>{props.form.institution || 'As informações do concurso aparecerão aqui.'}</p>
          <div className="path-context-line" />
          <dl>
            <div><dt>Momento</dt><dd>{props.form.intent === 'completed' ? 'Já realizado' : props.form.intent === 'future' ? 'Objetivo futuro' : 'A definir'}</dd></div>
            <div><dt>Horizonte</dt><dd>{props.step >= 3 ? stageLabel : 'A definir'}</dd></div>
            <div><dt>Matérias</dt><dd>{props.form.areas.length || '—'}</dd></div>
          </dl>
          <small>Esta prévia acompanha suas escolhas. Nada será salvo antes da confirmação.</small>
        </aside>
      </div>
    </main>
  );
}
