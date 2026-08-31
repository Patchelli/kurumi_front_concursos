import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { useCapsuleDelivery } from './CapsuleDelivery.context';
import type { Capsule } from './Capsule.type';
import { CapsuleView } from './Capsule.view';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';

const MOCK_CAPSULES: Capsule[] = [
  {
    id: 1,
    title: 'Mensagem para meu eu daqui a um ano',
    message: 'Hoje estou começando minha preparação. Quero saber onde cheguei. Espero ter passado no concurso e estar orgulhoso de mim mesmo.',
    status: 'SCHEDULED',
    triggerType: 'DATE',
    scheduledAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Quando eu terminar Direito Tributário',
    message: 'Se você está lendo isso, conseguiu terminar Tributário. Lembra de quando parecia impossível? Você foi mais forte do que pensava.',
    status: 'DELIVERED',
    triggerType: 'SUBJECT_COMPLETED',
    triggerReferenceLabel: 'Direito Tributário',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    deliveredAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Primeiras 1.000 questões',
    message: 'Você chegou a 1.000 questões resolvidas. Isso é muita coisa! Você merece comemorar esse marco.',
    videoUrl: 'https://www.youtube.com/watch?v=vagjXnjqeas',
    status: 'OPENED',
    triggerType: 'QUESTIONS_REACHED',
    triggerValue: 1000,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    deliveredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    openedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export function CapsuleController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [capsules, setCapsules] = useState<Capsule[]>(MOCK_CAPSULES);
  const { push } = useCapsuleDelivery();

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    journeyService.findById(journeyId)
      .then(data => { if (active) setJourney(data); })
      .catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar as cápsulas.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const onOpen = useCallback((capsuleId: number) => {
    setCapsules(curr =>
      curr.map(c =>
        c.id === capsuleId && c.status === 'DELIVERED'
          ? { ...c, status: 'OPENED', openedAt: new Date().toISOString() }
          : c,
      ),
    );
  }, []);

  // Push delivered capsules to global delivery context
  useEffect(() => {
    capsules
      .filter(c => c.status === 'DELIVERED')
      .forEach(c => push({ capsule: c, onOpen }));
  }, [capsules, push, onOpen]);

  const onCreate = (data: Omit<Capsule, 'id' | 'createdAt' | 'status'>) => {
    setCapsules(curr => [
      { ...data, id: Date.now(), createdAt: new Date().toISOString(), status: 'SCHEDULED' },
      ...curr,
    ]);
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
