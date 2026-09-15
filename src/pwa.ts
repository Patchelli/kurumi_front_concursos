import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

export type InstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallListener = (prompt: InstallPromptEvent | null) => void;
const installListeners = new Set<InstallListener>();
let installPrompt: InstallPromptEvent | null = null;
let updateServiceWorker: (reloadPage?: boolean) => Promise<void>;

function notifyInstallListeners() { installListeners.forEach(listener => listener(installPrompt)); }

export function subscribeInstallPrompt(listener: InstallListener) {
  installListeners.add(listener);
  listener(installPrompt);
  return () => { installListeners.delete(listener); };
}

export async function installPwa() {
  const prompt = installPrompt;
  if (!prompt) return false;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  installPrompt = null;
  notifyInstallListeners();
  return choice.outcome === 'accepted';
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event as InstallPromptEvent;
  notifyInstallListeners();
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  notifyInstallListeners();
  toast.success('Kurumi instalado na sua tela inicial.');
});

updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast.info('Uma nova versão está disponível.', { duration: Infinity, action: { label: 'Atualizar', onClick: () => { void updateServiceWorker(true); } } });
  },
  onRegisterError() { toast.error('Não foi possível preparar o acesso offline.'); },
});
