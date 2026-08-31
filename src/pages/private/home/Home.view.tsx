import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import type { HomeViewProps } from './Home.type';
import { ContestCreationDrawer } from '../../../components/contestCreation/ContestCreationDrawer';
import { ConfirmDialog } from '../../../components/dialog/ConfirmDialog';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { UserMenu } from '@components/layout/UserMenu';
import { JourneyCard, NewJourneyCard } from './Home.widgets';

function formatMinutes(value: number) { const h = Math.floor(value / 60); const m = value % 60; return h ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`; }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

export function HomeView(props: HomeViewProps) {
  const completed = props.journeys.filter(item => item.stage === EJourneyStage.Completed).length;
  const minutes = props.journeys.reduce((sum, item) => sum + (item.studiedMinutes ?? 0), 0);
  const questions = props.journeys.reduce((sum, item) => sum + (item.questionsSolved ?? 0), 0);
  const correct = props.journeys.reduce((sum, item) => sum + (item.correctAnswers ?? 0), 0);
  const accuracy = questions ? Math.round(correct / questions * 100) : null;

  return <div className="journey-hub">
    <header className="hub-topbar">
      <a className="hub-brand" href="/inicio" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></a>
      <nav className="hub-nav" aria-label="Navegação principal"><button className="active" type="button">Jornadas</button><a href="/calendario">Calendário</a><button type="button" disabled>Desempenho</button></nav>
      <UserMenu firstName={props.firstName} onLogout={props.onLogout} />
    </header>

    <main className="hub-content">
      <section className="hub-welcome"><div><h1>{greeting()}, {props.firstName}.</h1><p>Escolha onde continuar ou transforme um novo objetivo em plano.</p></div><button className="filled-button hub-create hub-create-top" type="button" onClick={props.onOpenCreation}><span>＋</span> Nova jornada</button></section>

      <section className="insight-strip general-statistics" aria-label="Estatísticas gerais">
        <header className="general-statistics-heading"><div><span className="eyebrow">VISÃO CONSOLIDADA</span><h2>Resumo geral</h2></div><p>Soma do seu desempenho em todos os concursos</p></header>
        <article><span className="insight-icon violet">✓</span><div><strong>{completed}</strong><span>concursos realizados</span></div></article>
        <article><span className="insight-icon blue">▣</span><div><strong>{questions.toLocaleString('pt-BR')}</strong><span>questões resolvidas</span></div></article>
        <article><span className="insight-icon green">◷</span><div><strong>{formatMinutes(minutes)}</strong><span>horas estudadas</span></div></article>
        <article><span className="insight-icon amber">◎</span><div><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span>acertos no geral</span></div></article>
      </section>

      <section className="journeys-section">
        <div className="section-heading"><div><span className="eyebrow">SEUS OBJETIVOS</span><h2>Jornadas em movimento</h2></div><div className="journey-tools"><label className="search-field"><span>⌕</span><input value={props.query} onChange={event => props.onQueryChange(event.target.value)} placeholder="Buscar jornada" /></label><button type="button" onClick={() => props.onScroll(-1)} aria-label="Anterior">←</button><button type="button" onClick={() => props.onScroll(1)} aria-label="Próximo">→</button></div></div>
        {props.error && <div className="hub-error" role="alert">{props.error}</div>}
        {props.loading ? <StudyLoading variant="section" label="Buscando seus concursos…" /> : <div className="journey-carousel" ref={props.carouselRef} onPointerDown={props.onPointerDown} onPointerMove={props.onPointerMove} onPointerUp={props.onPointerUp} onPointerCancel={props.onPointerUp}>{props.visibleJourneys.map((journey, index) => <JourneyCard key={journey.id} journey={journey} index={index} onOpen={() => props.onOpenJourney(journey.id)} onEdit={() => props.onRequestEdit(journey)} onRemove={() => props.onRequestRemove(journey)} />)}{!props.query && <NewJourneyCard onClick={props.onOpenCreation} />}</div>}
        {!props.loading && !props.visibleJourneys.length && props.query && <p className="no-results">Nenhuma jornada encontrada para “{props.query}”.</p>}
        <p className="drag-tip">Arraste os cartões para os lados <span>↔</span></p>
      </section>
    </main>

    <button className="hub-fab" type="button" onClick={props.onOpenCreation} aria-label="Nova jornada">＋</button>
    {props.creationOpen && !props.editingContest && <ContestCreationDrawer mode="create" open onClose={props.onCloseCreation} onCreate={props.onCreate} />}
    {props.editingContest && <ContestCreationDrawer mode="edit" open initialData={props.editingContest} onClose={props.onCancelEdit} onSave={props.onSaveEdit} />}
    <ConfirmDialog open={Boolean(props.removingContest)} title="Remover concurso?" description={`“${props.removingContest?.title ?? ''}” será retirado da sua central. Esta ação não poderá ser desfeita.`} confirmLabel="Remover" danger onClose={props.onCancelRemove} onConfirm={() => props.removingContest && props.onRemove(props.removingContest.id)} />
  </div>;
}
