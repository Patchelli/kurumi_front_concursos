import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { installPwa, subscribeInstallPrompt, type InstallPromptEvent } from '../../pwa';

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => subscribeInstallPrompt(next => { setPrompt(next); if (next) setHidden(false); }), []);
  if (!prompt || hidden) return null;

  async function install() {
    setInstalling(true);
    const accepted = await installPwa();
    setInstalling(false);
    if (accepted) toast.success('Kurumi instalado na sua tela inicial.');
  }

  return <aside className="pwa-install-card" aria-label="Instalar Kurumi">
    <div className="pwa-install-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 11v4.5c2.7 2.1 7.3 2.1 10 0V11M20 10v5"/><circle cx="20" cy="16.5" r="1" fill="currentColor" stroke="none"/></svg>
    </div>
    <div className="pwa-install-copy"><strong>Instale o Kurumi</strong><span>Estude com acesso rápido pela tela inicial.</span></div>
    <div className="pwa-install-actions"><button type="button" className="pwa-install-dismiss" onClick={() => setHidden(true)}>Agora não</button><button type="button" className="pwa-install-confirm" onClick={() => void install()} disabled={installing}>{installing ? 'Abrindo…' : 'Instalar'}</button></div>
  </aside>;
}
