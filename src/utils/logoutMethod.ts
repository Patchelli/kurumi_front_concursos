import { clearAuthentication } from './authenticationStorage';

export function logoutMethod(): void {
  clearAuthentication();
  window.location.href = '/entrar';
}
