import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '@business/dto/response/journey.response';
import type { StudyRoutineConfigurationRequest } from '@business/dto/request/studyRoutine.request';
import { journeyService } from '@business/service/Journey.service';
import { studyRoutineService } from '@business/service/StudyRoutine.service';
import { getRequestErrorMessage } from '@utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { StudyPlanView } from './StudyPlan.view';
export function StudyPlanController() {
  const { id } = useParams(); const navigate = useNavigate(); const journeyId = Number(id);
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null); const [configuration, setConfiguration] = useState<StudyRoutineConfigurationRequest>(); const [routineId, setRoutineId] = useState<number>(); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; } let active = true; journeyService.findById(journeyId).then(data => { if (active) setJourney(data); }).catch(error => { if (active) { setJourney(null); toast.error(getRequestErrorMessage(error, 'Não foi possível carregar o plano de estudos.')); } }).finally(() => { if (active) setLoading(false); }); studyRoutineService.findAll(journeyId).then(routines => { if (!active) return; const routine = routines.find(item => item.active) ?? routines[0]; if (routine) { setRoutineId(routine.id); setConfiguration(routine.configuration); } }).catch(() => { /* API antiga: mantém o plano visual até a nova versão ser publicada. */ }); return () => { active = false; }; }, [journeyId]);
  async function saveConfiguration(value: StudyRoutineConfigurationRequest) { const body = { journeyId, title: 'Plano de estudos', kind: 1 as const, configuration: value }; const result = routineId ? await studyRoutineService.update({ id: routineId, ...body }) : await studyRoutineService.register(body); setRoutineId(result.id); setConfiguration(result.configuration); }
  return <StudyPlanView journey={journey} loading={loading} configuration={configuration} onSaveConfiguration={saveConfiguration} onBack={() => navigate('/')} onOverview={() => navigate(`/jornadas/${id}`)} onOpenContent={() => navigate(`/jornadas/${id}/materias`)} onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)} onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)} onOpenSubject={areaId => navigate(`/jornadas/${id}/materias/${areaId}`)} />;
}
