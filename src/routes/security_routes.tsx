import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  authenticationChangedEvent,
  getAccessToken,
  getTokenExpiration,
} from '../utils/authenticationStorage';

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
