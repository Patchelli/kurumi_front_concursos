import { useCallback, useEffect, useState } from 'react';
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
  const { push } = useCapsuleDelivery();

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    journeyService.findById(journeyId)
      .then(async data => { if (active) { setJourney(data); setCapsules(await timeCapsuleService.list(journeyId)); } })
      .catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar as cápsulas.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) return;
    const timer = window.setInterval(() => {
      void timeCapsuleService.list(journeyId).then(setCapsules).catch(() => {});
    }, 60_000);
    return () => window.clearInterval(timer);
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
    />
  );
}
