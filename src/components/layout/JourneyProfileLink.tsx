import { Link, useLocation } from 'react-router-dom';
import { logoutMethod } from '../../utils/logoutMethod';

export function JourneyProfileLink() {
  const location = useLocation();

  return (
    <Link className="jd-nav-link jd-profile-link" to="/perfil" state={{ from: `${location.pathname}${location.search}` }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
      <span>Meu perfil</span>
    </Link>
  );
}

export function JourneySidebarAccountActions() {
  return (
    <>
      <JourneyProfileLink />
      <button className="jd-logout-btn" type="button" onClick={logoutMethod}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span>Sair</span>
      </button>
    </>
  );
}

export function JourneyMobileProfileLink() {
  const location = useLocation();

  return (
    <Link className="jd-mobile-profile-link" to="/perfil" state={{ from: `${location.pathname}${location.search}` }} aria-label="Abrir meu perfil">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    </Link>
  );
}
