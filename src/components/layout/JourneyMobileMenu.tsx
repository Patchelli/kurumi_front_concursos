import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logoutMethod } from '../../utils/logoutMethod';

export type JourneyMobileMenuActive = 'overview' | 'plan' | 'simulados' | 'capsule' | 'content';

interface JourneyMobileMenuProps {
  active: JourneyMobileMenuActive;
  onOverview?: () => void;
  onStudyPlan?: () => void;
  onSimulados?: () => void;
  onCapsule?: () => void;
  onContent?: () => void;
  onBack?: () => void;
}

const NAV_ITEMS: Array<{ key: JourneyMobileMenuActive; label: string; icon: React.ReactNode }> = [
  {
    key: 'overview', label: 'Visão geral',
    icon: <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
  {
    key: 'plan', label: 'Plano de estudos',
    icon: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  },
  {
    key: 'simulados', label: 'Simulados',
    icon: <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    key: 'capsule', label: 'Cápsula',
    icon: <svg viewBox="0 0 24 24"><path d="M5 2h14M5 22h14M7 2v6l5 4-5 4v6M17 2v6l-5 4 5 4v6" /></svg>,
  },
  {
    key: 'content', label: 'Conteúdo',
    icon: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  },
];

const HANDLERS: Record<JourneyMobileMenuActive, keyof JourneyMobileMenuProps> = {
  overview: 'onOverview',
  plan: 'onStudyPlan',
  simulados: 'onSimulados',
  capsule: 'onCapsule',
  content: 'onContent',
};

export function JourneyMobileMenu(props: JourneyMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  function handleNav(key: JourneyMobileMenuActive) {
    setOpen(false);
    if (key === props.active) return;
    const handler = props[HANDLERS[key]] as (() => void) | undefined;
    handler?.();
  }

  return (
    <>
      <button className="jm-side-trigger" type="button" aria-label="Abrir menu" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      {open && <div className="jm-overlay" onClick={() => setOpen(false)} />}

      <nav className={`jm-drawer${open ? ' jm-drawer--open' : ''}`}>
        <div className="jm-drawer-header">
          <strong>Kurumí</strong>
          <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="jm-nav-list">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`jm-nav-item${item.key === props.active ? ' active' : ''}`}
              type="button"
              onClick={() => handleNav(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="jm-drawer-footer">
          <Link
            className="jm-nav-item jm-profile-item"
            to="/perfil"
            state={{ from: `${location.pathname}${location.search}` }}
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
            <span>Meu perfil</span>
          </Link>
          <button className="jm-nav-item jm-logout-item" type="button" onClick={logoutMethod}>
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
}
