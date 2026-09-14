import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { installPwa, subscribeInstallPrompt, type InstallPromptEvent } from '../../pwa';

export function PwaInstallPrompt() {
  const location = useLocation();
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [checked, setChecked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt(next => { setPrompt(next); setChecked(true); if (next) setHidden(false); });
    const timer = window.setTimeout(() => setChecked(true), 900);
    return () => { unsubscribe(); window.clearTimeout(timer); };
  }, []);

  const isPublicPage = location.pathname === '/entrar' || location.pathname === '/cadastro';
  const isInstalled = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone;
  if (!checked || hidden || isPublicPage || isInstalled) return null;

  async function install() {
    if (!prompt) {
      toast.info('Atualizando o Kurumi para liberar a instalação.');
      window.location.reload();
      return;
    }
    setInstalling(true);
    const accepted = await installPwa();
    setInstalling(false);
    if (accepted) toast.success('Kurumi instalado na sua tela inicial.');
  }

  const ready = Boolean(prompt);
  return <aside className="pwa-install-card" aria-label="Instalar Kurumi">
    <div className="pwa-install-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 11v4.5c2.7 2.1 7.3 2.1 10 0V11M20 10v5"/><circle cx="20" cy="16.5" r="1" fill="currentColor" stroke="none"/></svg></div>
    <div className="pwa-install-copy"><small>INSTALAR APLICATIVO</small><strong>{ready ? 'Leve o Kurumi para sua tela inicial' : 'Prepare o Kurumi para instalar'}</strong><span>{ready ? 'Acesse seus estudos como um app.' : 'Atualize uma vez para liberar a instalação neste navegador.'}</span></div>
    <div className="pwa-install-actions"><button type="button" className="pwa-install-dismiss" onClick={() => setHidden(true)}>Agora não</button><button type="button" className="pwa-install-confirm" onClick={() => void install()} disabled={installing}>{installing ? 'Abrindo…' : ready ? 'Instalar' : 'Atualizar'}</button></div>
  </aside>;
}
