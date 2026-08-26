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
    const timeout = expiration === null
      ? undefined
      : window.setTimeout(updateToken, Math.max(0, expiration - Date.now()));

    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      window.removeEventListener(authenticationChangedEvent, updateToken);
      window.removeEventListener('storage', updateToken);
    };
  }, [token]);

  return token ? children : <Navigate to="/entrar" replace />;
}
