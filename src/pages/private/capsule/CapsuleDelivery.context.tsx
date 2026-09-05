import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Capsule } from './Capsule.type';
import { timeCapsuleProgressChangedEvent, timeCapsuleService } from '../../../../@business/service/TimeCapsule.service';

export type PendingDelivery = {
  capsule: Capsule;
  onOpen(id: number): void;
};

type DeliveryCtx = {
  pending: PendingDelivery[];
  push(d: PendingDelivery): void;
  dismiss(id: number): void;
};

const Ctx = createContext<DeliveryCtx>({
  pending: [],
  push: () => {},
  dismiss: () => {},
});

export function CapsuleDeliveryProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDelivery[]>([]);

  const push = useCallback((d: PendingDelivery) => {
    setPending(prev =>
      prev.some(p => p.capsule.id === d.capsule.id) ? prev : [...prev, d],
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    setPending(prev => prev.filter(p => p.capsule.id !== id));
  }, []);

  useEffect(() => {
    const synchronize = () => {
      const match = window.location.pathname.match(/\/jornadas\/(\d+)/);
      if (!match) return;
      void timeCapsuleService.list(Number(match[1])).then(items => {
        items.filter(item => item.status === 'DELIVERED').forEach(capsule =>
          push({ capsule, onOpen: capsuleId => { void timeCapsuleService.open(capsuleId); } }));
      }).catch(() => {});
    };
    window.addEventListener(timeCapsuleProgressChangedEvent, synchronize);
    return () => window.removeEventListener(timeCapsuleProgressChangedEvent, synchronize);
  }, [push]);

  return <Ctx.Provider value={{ pending, push, dismiss }}>{children}</Ctx.Provider>;
}

export function useCapsuleDelivery() {
  return useContext(Ctx);
}
