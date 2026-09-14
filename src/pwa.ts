import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

let updateServiceWorker: (reloadPage?: boolean) => Promise<void>;

updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast.info('Uma nova versão está disponível.', {
      duration: Infinity,
      action: {
        label: 'Atualizar',
        onClick: () => { void updateServiceWorker(true); },
      },
    });
  },
  onOfflineReady() {
    toast.success('O Kurumi está pronto para uso offline.');
  },
  onRegisterError() {
    toast.error('Não foi possível preparar o acesso offline.');
  },
});
