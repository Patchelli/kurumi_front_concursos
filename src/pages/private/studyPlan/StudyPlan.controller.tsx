import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '@business/dto/response/journey.response';
import type { StudyRoutineConfigurationRequest } from '@business/dto/request/studyRoutine.request';
import { journeyService } from '@business/service/Journey.service';
import { studyRoutineService } from '@business/service/StudyRoutine.service';
import { studyResourceService } from '@business/service/StudyResource.service';
import { syllabusNodeStudyService, type SyllabusNodeStudyRequest, type SyllabusNodeStudyResponse } from '@business/service/SyllabusNodeStudy.service';
import { studyTimerFinishedEvent } from '@business/service/StudyTimer.service';
import { getRequestErrorMessage } from '@utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { StudyPlanView } from './StudyPlan.view';
import { notifyTimeCapsuleProgressChanged } from '@business/service/TimeCapsule.service';

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startOfWeek = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

export function StudyPlanController() {
  const { id } = useParams(); const navigate = useNavigate(); const journeyId = Number(id);
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null); const [configuration, setConfiguration] = useState<StudyRoutineConfigurationRequest>();
  const [routineId, setRoutineId] = useState<number>(); const [routineBlocks, setRoutineBlocks] = useState<Awaited<ReturnType<typeof studyRoutineService.blocks>>>([]); const [loading, setLoading] = useState(true); const [nodeStudy, setNodeStudy] = useState<SyllabusNodeStudyResponse[]>([]);
  useEffect(() => { if (!Number.isSafeInteger(journeyId) || journeyId <= 0) { setJourney(null); setLoading(false); return; } let active = true; journeyService.findById(journeyId).then(data => active && setJourney(data)).catch(error => active && (setJourney(null), toast.error(getRequestErrorMessage(error, 'Não foi possível carregar o plano de estudos.')))).finally(() => active && setLoading(false)); syllabusNodeStudyService.list(journeyId).then(data => active && setNodeStudy(data)).catch(() => active && setNodeStudy([])); studyRoutineService.findAll(journeyId).then(async routines => { const routine = routines.find(item => item.active) ?? routines[0]; if (!active || !routine) return; setRoutineId(routine.id); setConfiguration(routine.configuration); const now = new Date(); const end = new Date(now.getFullYear(), now.getMonth() + 13, 0); let data = await studyRoutineService.blocks(routine.id, localDate(startOfWeek(now)), localDate(end)); if (!data.length) data = await studyRoutineService.generate(routine.id, journeyId); if (active) setRoutineBlocks(data); }).catch(() => {}); return () => { active = false; }; }, [journeyId]);
  useEffect(() => {
    const refresh = async (event: Event) => {
      if ((event as CustomEvent<{ journeyId: number }>).detail?.journeyId !== journeyId) return;
      try { setNodeStudy(await syllabusNodeStudyService.list(journeyId)); } catch { /* next load retries */ }
      if (routineId) try {
        const now = new Date(); const end = new Date(now.getFullYear(), now.getMonth() + 13, 0);
        setRoutineBlocks(await studyRoutineService.blocks(routineId, localDate(startOfWeek(now)), localDate(end)));
      } catch { /* next load retries */ }
    };
    window.addEventListener(studyTimerFinishedEvent, refresh);
    return () => window.removeEventListener(studyTimerFinishedEvent, refresh);
  }, [journeyId, routineId]);
  async function saveConfiguration(value: StudyRoutineConfigurationRequest) { const body = { journeyId, title: 'Plano de estudos', kind: 1 as const, configuration: value }; const result = routineId ? await studyRoutineService.update({ id: routineId, ...body }) : await studyRoutineService.register(body); setRoutineId(result.id); setConfiguration(result.configuration); setRoutineBlocks(await studyRoutineService.generate(result.id, journeyId)); }
  async function completeBlock(blockId: number, completed: boolean, completedMinutes = 0, scheduleReview = false, reviewDate: string | null = null, clearPending = false, summary: string | null = null) {
    const planned = routineBlocks.find(block => block.id === blockId)?.plannedMinutes ?? 0;
    const result = await studyRoutineService.complete({ blockId, completed, completedMinutes: completedMinutes > 0 ? completedMinutes : (completed ? planned : 0), scheduleReview, reviewDate, clearPending, summary });
    notifyTimeCapsuleProgressChanged();
    setRoutineBlocks(current => current.map(block => block.id === blockId ? result : block));
    if (routineId) {
      try {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth() + 13, 0);
        setRoutineBlocks(await studyRoutineService.blocks(routineId, localDate(startOfWeek(now)), localDate(end)));
      } catch {
        // O bloco já foi salvo; a atualização da listagem pode ser refeita no próximo carregamento.
      }
      try {
        setNodeStudy(await syllabusNodeStudyService.list(journeyId));
      } catch {
        // O status dos tópicos será sincronizado na próxima consulta.
      }
    }
  }
  async function saveNodeStudy(request: SyllabusNodeStudyRequest) {
    const result = await syllabusNodeStudyService.save(request);
    notifyTimeCapsuleProgressChanged();
    setNodeStudy(current => [...current.filter(item => item.syllabusNodeId !== result.syllabusNodeId), result]);
    if (routineId) {
      try {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth() + 13, 0);
        setRoutineBlocks(await studyRoutineService.blocks(routineId, localDate(startOfWeek(now)), localDate(end)));
      } catch {
        // O progresso do subtópico já foi salvo; uma falha ao atualizar a lista não desfaz a operação.
      }
    }
    return result;
  }
  return <StudyPlanView journey={journey} loading={loading} configuration={configuration} routineBlocks={routineBlocks} nodeStudy={nodeStudy} onQuestionsSaved={async () => setNodeStudy(await syllabusNodeStudyService.list(journeyId))} onSaveConfiguration={saveConfiguration} onCompleteBlock={completeBlock} onSaveNodeStudy={saveNodeStudy} onListResources={nodeId => studyResourceService.list(journeyId, nodeId)} onSaveResource={request => studyResourceService.register(request)} onDeleteResource={async resourceId => { await studyResourceService.remove(resourceId); }} onBack={() => navigate('/inicio')} onOverview={() => navigate(`/jornadas/${id}`)} onOpenContent={() => navigate(`/jornadas/${id}/materias`)} onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)} onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)} onOpenSubject={areaId => navigate(`/jornadas/${id}/materias/${areaId}`)} />;
}
