import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { SimuladosView } from './Simulados.view';
import { mockAssessmentService, type MockAssessment } from '../../../../@business/service/MockAssessment.service';
import { notifyTimeCapsuleProgressChanged } from '@business/service/TimeCapsule.service';

export function SimuladosController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<MockAssessment[]>([]);

  useEffect(() => {
    const journeyId = Number(id);
    if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    Promise.all([journeyService.findById(journeyId), mockAssessmentService.list(journeyId)])
      .then(([data, assessments]) => { if (active) { setJourney(data); setEntries(assessments); } })
      .catch(err => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(err, 'Não foi possível carregar os simulados.')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <SimuladosView
      journey={journey}
      loading={loading}
      entries={entries}
      saving={saving}
      onSave={async (assessmentId, request) => { setSaving(true); try { const saved=assessmentId===null?await mockAssessmentService.register(request):await mockAssessmentService.update(assessmentId,request); notifyTimeCapsuleProgressChanged(); setEntries(current=>assessmentId===null?[saved,...current]:current.map(item=>item.id===assessmentId?saved:item)); toast.success(assessmentId===null?'Simulado registrado.':'Simulado atualizado.'); } catch(error){toast.error(getRequestErrorMessage(error,'Não foi possível salvar o simulado.'));throw error;} finally{setSaving(false);} }}
      onDelete={async assessmentId => { try { await mockAssessmentService.remove(assessmentId); setEntries(current=>current.filter(item=>item.id!==assessmentId)); toast.success('Simulado excluído.'); } catch(error){toast.error(getRequestErrorMessage(error,'Não foi possível excluir o simulado.'));throw error;} }}
      onBack={() => navigate('/inicio')}
      onOverview={() => navigate(`/jornadas/${id}`)}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenContent={() => navigate(`/jornadas/${id}/materias`)}
      onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
    />
  );
}
