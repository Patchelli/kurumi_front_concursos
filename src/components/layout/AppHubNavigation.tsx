import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';

type AppHubNavigationProps = { active: 'journeys' | 'calendar' | 'radar' | null; firstName: string; onLogout(): void };

const navItems = [
  { key: 'journeys', label: 'Jornadas', to: '/inicio', icon: <svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg> },
  { key: 'calendar', label: 'Calendário', to: '/calendario', icon: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { key: 'radar', label: 'Radar', to: '/radar', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" /><path d="M2 12h20" /></svg> },
] as const;

export function AppHubNavigation({ active, firstName, onLogout }: AppHubNavigationProps) {
  return <><header className="hub-topbar"><Link className="hub-brand" to="/inicio" aria-label="Kurumí"><span className="hub-logo">K</span><span>Kurumí</span></Link><nav className="hub-nav" aria-label="Navegação principal">{navItems.map(item => <Link key={item.key} to={item.to} className={active === item.key ? 'active' : ''} aria-current={active === item.key ? 'page' : undefined}>{item.icon}{item.label}</Link>)}</nav><UserMenu firstName={firstName} onLogout={onLogout} /></header><nav className="hub-mobile-nav" aria-label="Navegação mobile">{navItems.map(item => <Link key={item.key} to={item.to} className={active === item.key ? 'active' : ''} aria-current={active === item.key ? 'page' : undefined}><span>{item.icon}</span>{item.label}</Link>)}</nav></>;
}