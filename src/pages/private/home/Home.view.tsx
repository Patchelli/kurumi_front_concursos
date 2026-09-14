import { AppHubNavigation } from '@components/layout/AppHubNavigation';
import { EJourneyStage } from '../../../../@business/enum/EJourneyStage';
import type { HomeViewProps } from './Home.type';
import { ContestCreationDrawer } from '../../../components/contestCreation/ContestCreationDrawer';
import { ConfirmDialog } from '../../../components/dialog/ConfirmDialog';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { JourneyCard, NewJourneyCard } from './Home.widgets';

function formatMinutes(value: number) { const h = Math.floor(value / 60); const m = value % 60; return h ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`; }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

export function HomeView(props: HomeViewProps) {
  const completed = props.journeys.filter(item => item.stage === EJourneyStage.Completed).length;
  const statisticalJourneys = props.journeys.filter(item => item.includeInStatistics);
  const minutes = statisticalJourneys.reduce((sum, item) => sum + item.studiedMinutes, 0);
  const questions = statisticalJourneys.reduce((sum, item) => sum + item.questionsSolved, 0);
  const correct = statisticalJourneys.reduce((sum, item) => sum + item.correctAnswers, 0);
  const accuracy = questions ? Math.round(correct / questions * 1000) / 10 : null;

  return <div className="journey-hub">
    <AppHubNavigation active="journeys" firstName={props.firstName} onLogout={props.onLogout} />

    <main className="hub-content">
      <section className="hub-welcome"><div><span className="hub-greeting">{greeting()},</span><h1>{props.firstName}.</h1></div><button className="hub-create hub-create-top" type="button" onClick={props.onOpenCreation}><span>＋</span> Nova jornada</button></section>

      <section className="stats-row" aria-label="Estatísticas gerais">
        <article className="stat-card"><span className="stat-icon violet">✓</span><div><strong>{completed}</strong><span>Concursos</span></div></article>
        <article className="stat-card"><span className="stat-icon blue">▣</span><div><strong>{questions.toLocaleString('pt-BR')}</strong><span>Questões</span></div></article>
        <article className="stat-card"><span className="stat-icon green">◷</span><div><strong>{formatMinutes(minutes)}</strong><span>Estudadas</span></div></article>
        <article className="stat-card"><span className="stat-icon amber">◎</span><div><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span>Acertos</span></div></article>
      </section>

      <section className="journeys-section">
        <div className="section-heading"><h2>Suas jornadas</h2><div className="journey-tools"><label className="search-field"><span>⌕</span><input value={props.query} onChange={event => props.onQueryChange(event.target.value)} placeholder="Buscar jornada" /></label><button type="button" onClick={() => props.onScroll(-1)} aria-label="Anterior">←</button><button type="button" onClick={() => props.onScroll(1)} aria-label="Próximo">→</button></div></div>
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
