import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { useCapsuleDelivery } from './CapsuleDelivery.context';
import type { Capsule } from './Capsule.type';
import { CapsuleView } from './Capsule.view';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { timeCapsuleService } from '../../../../@business/service/TimeCapsule.service';

export function CapsuleController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const { push, remove: removeDelivery } = useCapsuleDelivery();
  const removedIds = useRef(new Set<number>());

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    journeyService.findById(journeyId)
      .then(async data => {
        const items = await timeCapsuleService.list(journeyId);
        if (active) { setJourney(data); setCapsules(items.filter(item => !removedIds.current.has(item.id))); }
      })
      .catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar as cápsulas.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) return;
    let active = true;
    const timer = window.setInterval(() => {
      void timeCapsuleService.list(journeyId).then(items => {
        if (active) setCapsules(items.filter(item => !removedIds.current.has(item.id)));
      }).catch(() => {});
    }, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [id]);

  const onOpen = useCallback(async (capsuleId: number) => {
    const opened = await timeCapsuleService.open(capsuleId);
    setCapsules(curr => curr.map(c => c.id === capsuleId ? opened : c));
  }, []);

  // Push delivered capsules to global delivery context
  useEffect(() => {
    capsules
      .filter(c => c.status === 'DELIVERED')
      .forEach(c => push({ capsule: c, onOpen }));
  }, [capsules, push, onOpen]);

  const onCreate = async (data: Omit<Capsule, 'id' | 'createdAt' | 'status'>) => {
    const saved = await timeCapsuleService.register({ ...data, journeyId: Number(id) });
    setCapsules(curr => [saved, ...curr]);
  };

  const onDelete = async (capsuleId: number) => {
    const deleted = await timeCapsuleService.remove(capsuleId);
    if (!deleted) throw new Error('Não foi possível apagar a cápsula.');
    removedIds.current.add(capsuleId);
    removeDelivery(capsuleId);
    setCapsules(current => current.filter(capsule => capsule.id !== capsuleId));
    toast.success('Cápsula apagada.');
  };

  return (
    <CapsuleView
      capsules={capsules}
      journey={journey}
      loading={loading}
      onBack={() => navigate('/inicio')}
      onOverview={() => navigate(`/jornadas/${id}`)}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenContent={() => navigate(`/jornadas/${id}/materias`)}
      onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)}
      onCreate={onCreate}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );
}
