import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  authenticationChangedEvent,
  getAccessToken,
  getCachedRoles,
  getTokenExpiration,
  saveUserRoles,
} from '../utils/authenticationStorage';
import { userService } from '../../@business/service/User.service';
import { StudyLoading } from '../components/loading/StudyLoading';

export function PrivateRoute({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getAccessToken);

  useEffect(() => {
    const updateToken = () => setToken(getAccessToken());
    window.addEventListener(authenticationChangedEvent, updateToken);
    window.addEventListener('storage', updateToken);

    if (!token) return () => {
      window.removeEventListener(authenticationChangedEvent, updateToken);
      window.removeEventListener('storage', updateToken);
    };

    const expiration = getTokenExpiration(token);
    let timeout: number | undefined;
    const scheduleExpirationCheck = () => {
      if (expiration === null) return;
      const remaining = expiration - Date.now();
      timeout = window.setTimeout(() => {
        const nextToken = getAccessToken();
        setToken(nextToken);
        if (nextToken === token) scheduleExpirationCheck();
      }, Math.max(0, Math.min(remaining, 2_147_000_000)));
    };
    scheduleExpirationCheck();

    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      window.removeEventListener(authenticationChangedEvent, updateToken);
      window.removeEventListener('storage', updateToken);
    };
  }, [token]);

  return token ? children : <Navigate to="/entrar" replace />;
}

function isAdminRole(roles: string[]) {
  return roles.some(r => r.toLowerCase() === 'admin');
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getAccessToken);
  const [status, setStatus] = useState<'loading' | 'ok' | 'forbidden'>(() => {
    if (!getAccessToken()) return 'forbidden';
    const cached = getCachedRoles();
    if (cached === null) return 'loading';
    return isAdminRole(cached) ? 'ok' : 'forbidden';
  });

  useEffect(() => {
    const updateToken = () => setToken(getAccessToken());
    window.addEventListener(authenticationChangedEvent, updateToken);
    window.addEventListener('storage', updateToken);
    return () => {
      window.removeEventListener(authenticationChangedEvent, updateToken);
      window.removeEventListener('storage', updateToken);
    };
  }, []);

  useEffect(() => {
    if (!token) { setStatus('forbidden'); return; }
    const cached = getCachedRoles();
    if (cached !== null) { setStatus(isAdminRole(cached) ? 'ok' : 'forbidden'); return; }
    userService.getMyProfile()
      .then(profile => {
        saveUserRoles(profile.roles);
        setStatus(isAdminRole(profile.roles) ? 'ok' : 'forbidden');
      })
      .catch(() => setStatus('forbidden'));
  }, [token]);

  if (!token) return <Navigate to="/entrar" replace />;
  if (status === 'loading') return <StudyLoading delayMs={0} label="Verificando permissões…" />;
  if (status === 'forbidden') return <Navigate to="/inicio" replace />;
  return children;
}
