import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { SubjectDetailView, SubjectListView } from './Subject.view';

function useJourney(id: string | undefined) {
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    journeyService.findById(journeyId)
      .then(data => { if (active) setJourney(data); })
      .catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar o conteúdo.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  return { journey, loading };
}

export function SubjectListController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { journey, loading } = useJourney(id);
  return (
    <SubjectListView
      journey={journey}
      loading={loading}
      onBack={() => navigate('/')}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenOverview={() => navigate(`/jornadas/${id}`)}
      onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
      onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)}
      onSelectArea={areaId => navigate(`/jornadas/${id}/materias/${areaId}`)}
    />
  );
}

export function SubjectDetailController() {
  const { id, areaId } = useParams();
  const navigate = useNavigate();
  const { journey, loading } = useJourney(id);
  const area = journey?.knowledgeAreas.find(a => a.id === Number(areaId)) ?? null;
  return (
    <SubjectDetailView
      journey={journey}
      area={area}
      loading={loading}
      onBack={() => navigate('/')}
      onBackToList={() => navigate(`/jornadas/${id}/materias`)}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenOverview={() => navigate(`/jornadas/${id}`)}
      onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
      onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)}
      onRemoveNode={nodeId => { if (!window.confirm('Apagar este tópico/subtópico? Esta ação não pode ser desfeita.')) return; void journeyService.removeNode(nodeId).then(() => { toast.success('Conteúdo apagado.'); navigate(`/jornadas/${id}/materias`); }).catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível apagar o conteúdo.'))); }}
    />
  );
}
