import type { AuthenticationResponse } from '../../@business/dto/response/authentication.response';

const accessTokenKey = 'kurumi_concursos_access_token_v2';
const userKey = 'kurumi_concursos_user';
const rolesKey = 'kurumi_concursos_roles';
export const authenticationChangedEvent = 'kurumi-authentication-changed';

type JwtPayload = {
  exp?: number;
};

function getTokenPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(character => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string): number | null {
  const expiration = getTokenPayload(token)?.exp;
  return typeof expiration === 'number' ? expiration * 1000 : null;
}

export function saveAuthentication(authentication: AuthenticationResponse) {
  localStorage.setItem(accessTokenKey, authentication.accessToken);
  localStorage.setItem(userKey, JSON.stringify(authentication));
  window.dispatchEvent(new Event(authenticationChangedEvent));
}

export function updateStoredUserName(name: string) {
  try {
    const authentication = JSON.parse(localStorage.getItem(userKey) ?? '') as AuthenticationResponse;
    localStorage.setItem(userKey, JSON.stringify({ ...authentication, name }));
    window.dispatchEvent(new Event(authenticationChangedEvent));
  } catch {
    // The profile was saved remotely even if the local session metadata is unavailable.
  }
}

export function getAccessToken() {
  const token = localStorage.getItem(accessTokenKey);
  if (!token) return null;

  const expiration = getTokenExpiration(token);
  if (expiration === null || expiration <= Date.now()) {
    clearAuthentication();
    return null;
  }

  return token;
}

export function saveUserRoles(roles: string[]) {
  localStorage.setItem(rolesKey, JSON.stringify(roles));
}

export function getCachedRoles(): string[] | null {
  try {
    const stored = localStorage.getItem(rolesKey);
    return stored ? (JSON.parse(stored) as string[]) : null;
  } catch {
    return null;
  }
}

export function clearAuthentication() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(userKey);
  localStorage.removeItem(rolesKey);
  window.dispatchEvent(new Event(authenticationChangedEvent));
}
