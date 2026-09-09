import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Capsule } from './Capsule.type';
import { timeCapsuleProgressChangedEvent, timeCapsuleService } from '../../../../@business/service/TimeCapsule.service';

import { authenticationChangedEvent, getAccessToken } from '../../../utils/authenticationStorage';

export type PendingDelivery = {
  capsule: Capsule;
  onOpen(id: number): void;
};

type DeliveryCtx = {
  pending: PendingDelivery[];
  push(d: PendingDelivery): void;
  dismiss(id: number): void;
  remove(id: number): void;
};

const Ctx = createContext<DeliveryCtx>({
  pending: [],
  push: () => {},
  dismiss: () => {},
  remove: () => {},
});

export function CapsuleDeliveryProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDelivery[]>([]);
  const removedIds = useRef(new Set<number>());
  const [token, setToken] = useState(getAccessToken);

  const push = useCallback((d: PendingDelivery) => {
    if (removedIds.current.has(d.capsule.id)) return;
    setPending(prev =>
      prev.some(p => p.capsule.id === d.capsule.id) ? prev : [...prev, d],
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    setPending(prev => prev.filter(p => p.capsule.id !== id));
  }, []);

  const remove = useCallback((id: number) => {
    removedIds.current.add(id);
    dismiss(id);
  }, [dismiss]);

  useEffect(() => {
    const updateAuthentication = () => setToken(getAccessToken());
    window.addEventListener(authenticationChangedEvent, updateAuthentication);
    window.addEventListener('storage', updateAuthentication);
    return () => {
      window.removeEventListener(authenticationChangedEvent, updateAuthentication);
      window.removeEventListener('storage', updateAuthentication);
    };
  }, []);

  useEffect(() => {
    setPending([]);
    removedIds.current.clear();
    if (!token) return;
    let active = true;
    let inFlight = false;
    const synchronize = async () => {
      if (!active || inFlight || document.visibilityState === 'hidden' || getAccessToken() !== token) return;
      inFlight = true;
      try {
        const items = await timeCapsuleService.delivered();
        if (!active || getAccessToken() !== token) return;
        items.forEach(capsule => push({
          capsule,
          onOpen: capsuleId => {
            void timeCapsuleService.open(capsuleId).then(() => remove(capsuleId)).catch(() => {});
          },
        }));
      } catch {
        // Retry on the next interval or when connectivity returns.
      } finally {
        inFlight = false;
      }
    };
    void synchronize();
    const timer = window.setInterval(() => { void synchronize(); }, 15_000);
    window.addEventListener(timeCapsuleProgressChangedEvent, synchronize);
    window.addEventListener('focus', synchronize);
    window.addEventListener('online', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(timeCapsuleProgressChangedEvent, synchronize);
      window.removeEventListener('focus', synchronize);
      window.removeEventListener('online', synchronize);
      document.removeEventListener('visibilitychange', synchronize);
    };
  }, [token, push, remove]);
  return <Ctx.Provider value={{ pending, push, dismiss, remove }}>{children}</Ctx.Provider>;
}

export function useCapsuleDelivery() {
  return useContext(Ctx);
}
