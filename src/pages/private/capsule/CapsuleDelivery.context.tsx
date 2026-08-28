import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Capsule } from './Capsule.type';

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

  return <Ctx.Provider value={{ pending, push, dismiss }}>{children}</Ctx.Provider>;
}

export function useCapsuleDelivery() {
  return useContext(Ctx);
}
