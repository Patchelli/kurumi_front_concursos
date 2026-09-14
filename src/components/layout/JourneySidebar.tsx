import type { JourneyMobileMenuActive } from './JourneyMobileMenu';
import { JourneySidebarAccountActions } from './JourneyProfileLink';

type JourneySidebarProps = {
  active: JourneyMobileMenuActive;
  journeyTitle: string;
  journeyInstitution?: string | null;
  logoUrl?: string | null;
  onOverview(): void;
  onStudyPlan(): void;
  onSimulados(): void;
  onCapsule(): void;
  onContent(): void;
};

const items: Array<{ key: JourneyMobileMenuActive; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: 'Visão geral', icon: <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
  { key: 'plan', label: 'Plano de estudos', icon: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
  { key: 'simulados', label: 'Simulados', icon: <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { key: 'capsule', label: 'Cápsula', icon: <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6" /></svg> },
  { key: 'content', label: 'Conteúdo', icon: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
];

export function JourneySidebar({ active, journeyTitle, journeyInstitution, logoUrl, onOverview, onStudyPlan, onSimulados, onCapsule, onContent }: JourneySidebarProps) {
  const handlers = { overview: onOverview, plan: onStudyPlan, simulados: onSimulados, capsule: onCapsule, content: onContent };
  return <aside className="jd-sidebar">
    <div className="jd-brand"><span>K</span><strong>Kurumí</strong></div>
    <nav className="jd-nav" aria-label="Navegação da jornada">
      {items.map(item => <button key={item.key} className={item.key === active ? 'active' : ''} onClick={handlers[item.key]} aria-current={item.key === active ? 'page' : undefined}>{item.icon}<span>{item.label}</span></button>)}
    </nav>
    <div className="jd-contest-card"><div className="jd-thumb">{logoUrl ? <img src={logoUrl} alt="" /> : journeyTitle.slice(0, 2).toUpperCase()}</div><div><strong>{journeyTitle}</strong><small>{journeyInstitution || 'Concurso'}</small></div></div>
    <JourneySidebarAccountActions />
  </aside>;
}