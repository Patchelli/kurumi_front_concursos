import { Link, useLocation } from 'react-router-dom';
import { BrandLockup } from '../brand/BrandLockup';

type AppSidebarProps = { firstName: string; onLogout(): void };

const menuItems = [
  { label: 'Jornadas', route: '/', icon: '▤', enabled: true },
  { label: 'Calendário', route: '/calendario', icon: '□', enabled: true },
  { label: 'Desempenho', route: '/desempenho', icon: '⌁', enabled: false },
] as const;

export function AppSidebar({ firstName, onLogout }: AppSidebarProps) {
  const location = useLocation();
  return <aside className="app-sidebar">
    <Link className="app-sidebar-brand" to="/" aria-label="Página inicial"><BrandLockup /></Link>
    <nav aria-label="Navegação principal"><ul>{menuItems.map(item => <li key={item.label}>{item.enabled ? <Link className={location.pathname === item.route || (item.route === '/' && location.pathname.startsWith('/jornadas/')) ? 'active' : ''} to={item.route}><span>{item.icon}</span><small>{item.label}</small></Link> : <button type="button" disabled title={`${item.label} em breve`}><span>{item.icon}</span><small>{item.label}</small></button>}</li>)}</ul></nav>
    <div className="app-sidebar-user"><span>{firstName.charAt(0).toUpperCase()}</span><strong>{firstName}</strong><button type="button" onClick={onLogout} title="Sair da conta">↪</button></div>
  </aside>;
}
