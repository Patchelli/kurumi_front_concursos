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
  const minutes = props.journeys.reduce((sum, item) => sum + (item.studiedMinutes ?? 0), 0);
  const questions = props.journeys.reduce((sum, item) => sum + (item.questionsSolved ?? 0), 0);
  const correct = props.journeys.reduce((sum, item) => sum + (item.correctAnswers ?? 0), 0);
  const accuracy = questions ? Math.round(correct / questions * 100) : null;

  return <div className="journey-hub">
    <header className="hub-topbar">
      <a className="hub-brand" href="/" aria-label="Kurumí"><span className="hub-logo">S</span><span>Kurumí</span></a>
      <nav className="hub-nav" aria-label="Navegação principal"><button className="active" type="button">Jornadas</button><a href="/calendario">Calendário</a><button type="button" disabled>Desempenho</button></nav>
      <div className="hub-user"><div className="hub-profile"><span className="hub-avatar">{props.firstName.charAt(0).toUpperCase()}</span><span className="hub-profile-name">{props.firstName}</span></div><button className="logout-button" type="button" onClick={props.onLogout} aria-label="Sair da conta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17v2H5V5h5v2H7v10h3Zm4.59-10.41L20 12l-5.41 5.41L13.17 16l3-3H9v-2h7.17l-3-3 1.42-1.41Z" /></svg><span>Sair</span></button></div>
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
    {(props.creationOpen || props.editingContest) && <ContestCreationDrawer open initialData={props.editingContest} onClose={props.editingContest ? props.onCancelEdit : props.onCloseCreation} onCreate={props.onCreate} onSave={props.onSaveEdit} />}
    <ConfirmDialog open={Boolean(props.removingContest)} title="Remover concurso?" description={`“${props.removingContest?.title ?? ''}” será retirado da sua central. Esta ação não poderá ser desfeita.`} confirmLabel="Remover" danger onClose={props.onCancelRemove} onConfirm={() => props.removingContest && props.onRemove(props.removingContest.id)} />
  </div>;
}
