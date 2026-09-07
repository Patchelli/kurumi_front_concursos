import { useState } from 'react';
import { MaterialDialog } from '../../../components/dialog/MaterialDialog';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { StudyLoading } from '../../../components/loading/StudyLoading';
import { ContestFAB } from '../../../components/fab/ContestFAB';
import type { Capsule, CapsuleViewProps } from './Capsule.type';
import { CapsuleCard, CapsuleEmpty, CreateCapsuleDialog, RevealDialog } from './Capsule.widgets';
import { JourneySidebarAccountActions } from '@components/layout/JourneyProfileLink';
import { JourneyMobileMenu } from '@components/layout/JourneyMobileMenu';

type Tab = 'scheduled' | 'delivered' | 'opened';

export function CapsuleView({
  capsules, journey, loading,
  onBack, onOverview, onOpenStudyPlan, onOpenContent, onOpenSimulados,
  onCreate, onOpen, onDelete,
}: CapsuleViewProps) {
  const [tab, setTab] = useState<Tab>('scheduled');
  const [createOpen, setCreateOpen] = useState(false);
  const [revealTarget, setRevealTarget] = useState<Capsule | null>(null);
  const [rereadTarget, setRereadTarget] = useState<Capsule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Capsule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete(deleteTarget.id);
      setRevealTarget(current => current?.id === deleteTarget.id ? null : current);
      setRereadTarget(current => current?.id === deleteTarget.id ? null : current);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(getRequestErrorMessage(error, 'Não foi possível apagar a cápsula. Tente novamente.'));
    } finally { setDeleting(false); }
  }

  const scheduled = capsules.filter(c => c.status === 'SCHEDULED');
  const delivered  = capsules.filter(c => c.status === 'DELIVERED');
  const opened     = capsules.filter(c => c.status === 'OPENED');
  const visible    = tab === 'scheduled' ? scheduled : tab === 'delivered' ? delivered : opened;

  if (loading) return <StudyLoading label="Carregando cápsulas…" />;

  const TABS = [
    { key: 'scheduled' as Tab, label: 'Agendadas',  count: scheduled.length, alert: false },
    { key: 'delivered' as Tab, label: 'Entregues',  count: delivered.length,  alert: delivered.length > 0 },
    { key: 'opened'    as Tab, label: 'Abertas',    count: opened.length,     alert: false },
  ];

  return (
    <div className="jd-shell">
      <JourneyMobileMenu active="capsule" onOverview={onOverview} onStudyPlan={onOpenStudyPlan} onSimulados={onOpenSimulados} onContent={onOpenContent} onBack={onBack} />

      {/* ── Sidebar estática ── */}
      <aside className="jd-sidebar">
        <div className="jd-brand"><span>K</span><strong>Kurumí</strong></div>
        <nav className="jd-nav">
          <button onClick={onOverview}>
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Visão geral</span>
          </button>
          <button onClick={onOpenStudyPlan}>
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span>Plano de estudos</span>
          </button>
          <button onClick={onOpenSimulados}>
            <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Simulados</span>
          </button>
          <button className="active">
            <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6"/></svg>
            <span>Cápsula</span>
          </button>
          <button onClick={onOpenContent}>
            <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            <span>Conteúdo</span>
          </button>
        </nav>
        <JourneySidebarAccountActions />
        {journey && (
          <div className="jd-contest-card">
            <div className="jd-thumb">
              {journey.logoUrl
                ? <img src={journey.logoUrl} alt="" />
                : journey.title.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong>{journey.title}</strong>
              <small>{journey.institution || 'Concurso'}</small>
            </div>
          </div>
        )}
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="cp-main">

        {/* Header */}
        <header className="sp-header">
          <div>
            <span className="jd-page-context">CÁPSULAS DO TEMPO</span>
            <h1>Mensagens para o futuro</h1>
            <p className="sp-header-date">
              {journey?.title ?? ''} <span>·</span> Escreva para o seu eu do futuro
            </p>
          </div>
          <div className="cp-header-actions">
            <button className="cp-new-btn" type="button" onClick={() => setCreateOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Nova cápsula
            </button>
            <button className="jd-back-link" onClick={onBack}>
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Jornadas
            </button>
          </div>
        </header>

        {/* Stats strip */}
        <div className="cp-stats-strip">
          <div className="cp-stat-item">
            <strong>
              {scheduled.length}
              <span className="cp-stat-total">/{capsules.length}</span>
            </strong>
            <small>Agendadas</small>
          </div>
          <div className="cp-stat-div" aria-hidden="true" />
          <div className="cp-stat-item">
            <strong className={delivered.length > 0 ? 'cp-stat-alert' : ''}>{delivered.length}</strong>
            <small>Entregues</small>
          </div>
          <div className="cp-stat-div" aria-hidden="true" />
          <div className="cp-stat-item">
            <strong>{opened.length}</strong>
            <small>Abertas</small>
          </div>
        </div>

        {/* Tabs */}
        <div className="cp-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              className={`cp-tab${tab === t.key ? ' cp-tab--active' : ''}${t.alert ? ' cp-tab--alert' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="cp-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Grid de cápsulas */}
        {visible.length > 0 ? (
          <div className="cp-grid">
            {visible.map(capsule => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                onReveal={() => setRevealTarget(capsule)}
                onReread={() => setRereadTarget(capsule)}
                onDelete={() => { setDeleteError(''); setDeleteTarget(capsule); }}
              />
            ))}
          </div>
        ) : (
          <CapsuleEmpty tab={tab} onCreate={() => setCreateOpen(true)} />
        )}
      </main>


      {/* ── Dialogs ── */}
      <MaterialDialog
        open={Boolean(deleteTarget)}
        title="Apagar cápsula?"
        description={`A cápsula “${deleteTarget?.title ?? ''}” será apagada permanentemente. Esta ação não pode ser desfeita.`}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        actions={<>
          <button className="md-text-button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="md-danger-button" disabled={deleting} onClick={() => void confirmDelete()}>{deleting ? 'Apagando…' : 'Apagar cápsula'}</button>
        </>}
      >{deleteError && <p role="alert" className="auth-error">{deleteError}</p>}</MaterialDialog>
      <CreateCapsuleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreate}
        journey={journey}
      />
      {revealTarget && (
        <RevealDialog
          capsule={revealTarget}
          onClose={() => setRevealTarget(null)}
          onOpen={() => onOpen(revealTarget.id)}
        />
      )}
      {rereadTarget && (
        <RevealDialog
          capsule={rereadTarget}
          onClose={() => setRereadTarget(null)}
          onOpen={() => {}}
          readOnly
        />
      )}
      {journey && <ContestFAB journeyId={journey.id} areas={journey.knowledgeAreas} />}
    </div>
  );
}
