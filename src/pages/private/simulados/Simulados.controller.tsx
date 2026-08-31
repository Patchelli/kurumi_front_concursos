import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { SimuladosView } from './Simulados.view';

export function SimuladosController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    journeyService.findById(journeyId)
      .then(data => { if (active) setJourney(data); })
      .catch(err => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(err, 'Não foi possível carregar os simulados.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <SimuladosView
      journey={journey}
      loading={loading}
      onBack={() => navigate('/inicio')}
      onOverview={() => navigate(`/jornadas/${id}`)}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenContent={() => navigate(`/jornadas/${id}/materias`)}
      onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
    />
  );
}
