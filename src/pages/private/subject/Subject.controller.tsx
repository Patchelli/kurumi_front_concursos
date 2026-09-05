import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import { journeyService } from '../../../../@business/service/Journey.service';
import { studyResourceService } from '@business/service/StudyResource.service';
import { syllabusNodeStudyService, type SyllabusNodeStudyRequest, type SyllabusNodeStudyResponse } from '@business/service/SyllabusNodeStudy.service';
import { studyTimerFinishedEvent } from '@business/service/StudyTimer.service';
import { getRequestErrorMessage } from '../../../utils/getRequestErrorMessage';
import { toast } from 'sonner';
import { SubjectDetailView, SubjectListView } from './Subject.view';

function useJourney(id: string | undefined) {
  const [journey, setJourney] = useState<JourneyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);
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
  }, [id, version]);
  return { journey, loading, reload };
}

export function SubjectListController() {
  const { id } = useParams();
  const navigate = useNavigate();
  const journeyId = Number(id);
  const { journey, loading, reload } = useJourney(id);
  return (
    <SubjectListView
      journey={journey}
      loading={loading}
      onBack={() => navigate('/inicio')}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenOverview={() => navigate(`/jornadas/${id}`)}
      onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
      onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)}
      onSelectArea={areaId => navigate(`/jornadas/${id}/materias/${areaId}`)}
      onAddArea={title => {
        void journeyService.addArea({ id: null, journeyId: Number(id), title, order: journey?.knowledgeAreas.length ?? 0, weight: null, expectedQuestions: null })
          .then(() => { toast.success('Matéria adicionada!'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível adicionar a matéria.')));
      }}
      onEditArea={(editAreaId, title) => {
        const target = journey?.knowledgeAreas.find(a => a.id === editAreaId);
        if (!target) return;
        void journeyService.updateArea({ id: editAreaId, journeyId: Number(id), title, order: target.order, weight: target.weight, expectedQuestions: target.expectedQuestions })
          .then(() => { toast.success('Matéria atualizada!'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível atualizar a matéria.')));
      }}
      onDeleteArea={areaId => {
        void journeyService.removeArea(areaId)
          .then(() => { toast.success('Matéria apagada.'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível apagar a matéria.')));
      }}
      onListResources={knowledgeAreaId => studyResourceService.list(journeyId, undefined, knowledgeAreaId)}
      onSaveResource={request => studyResourceService.register(request)}
      onDeleteResource={async resourceId => { await studyResourceService.remove(resourceId); }}
    />
  );
}

export function SubjectDetailController() {
  const { id, areaId } = useParams();
  const navigate = useNavigate();
  const journeyId = Number(id);
  const { journey, loading, reload } = useJourney(id);
  const [nodeStudy, setNodeStudy] = useState<SyllabusNodeStudyResponse[]>([]);
  useEffect(() => {
    if (!journeyId) return;
    syllabusNodeStudyService.list(journeyId).then(setNodeStudy).catch(() => setNodeStudy([]));
  }, [journeyId]);
  useEffect(() => {
    const refresh = (event: Event) => {
      if ((event as CustomEvent<{ journeyId: number }>).detail?.journeyId !== journeyId) return;
      syllabusNodeStudyService.list(journeyId).then(setNodeStudy).catch(() => {});
    };
    window.addEventListener(studyTimerFinishedEvent, refresh);
    return () => window.removeEventListener(studyTimerFinishedEvent, refresh);
  }, [journeyId]);
  async function saveNodeStudy(request: SyllabusNodeStudyRequest) {
    const result = await syllabusNodeStudyService.save(request);
    try {
      setNodeStudy(await syllabusNodeStudyService.list(journeyId));
    } catch {
      setNodeStudy(current => [...current.filter(item => item.syllabusNodeId !== result.syllabusNodeId), result]);
    }
    return result;
  }
  const area = journey?.knowledgeAreas.find(a => a.id === Number(areaId)) ?? null;
  return (
    <SubjectDetailView
      journey={journey}
      area={area}
      loading={loading}
      onBack={() => navigate('/inicio')}
      onBackToList={() => navigate(`/jornadas/${id}/materias`)}
      onOpenStudyPlan={() => navigate(`/jornadas/${id}/plano`)}
      onOpenOverview={() => navigate(`/jornadas/${id}`)}
      onOpenCapsule={() => navigate(`/jornadas/${id}/capsulas`)}
      onOpenSimulados={() => navigate(`/jornadas/${id}/simulados`)}
      onRemoveNode={nodeId => { void journeyService.removeNode(nodeId).then(() => { toast.success('Conteúdo apagado.'); reload(); }).catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível apagar o conteúdo.'))); }}
      onDeleteArea={deleteAreaId => {
        void journeyService.removeArea(deleteAreaId)
          .then(() => { toast.success('Matéria apagada.'); navigate(`/jornadas/${id}/materias`); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível apagar a matéria.')));
      }}
      onAddTopic={(knowledgeAreaId, title) => {
        const area = journey?.knowledgeAreas.find(a => a.id === knowledgeAreaId);
        void journeyService.addNode({ id: null, knowledgeAreaId, parentId: null, title, order: area?.nodes.length ?? 0 })
          .then(() => { toast.success('Tópico adicionado!'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível adicionar o tópico.')));
      }}
      onAddSubtopic={(knowledgeAreaId, parentId, title) => {
        const area = journey?.knowledgeAreas.find(a => a.id === knowledgeAreaId);
        const topic = area?.nodes.find(n => n.id === parentId);
        void journeyService.addNode({ id: null, knowledgeAreaId, parentId, title, order: topic?.children.length ?? 0 })
          .then(() => { toast.success('Subtópico adicionado!'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível adicionar o subtópico.')));
      }}
      onEditArea={(editAreaId, title) => {
        const target = journey?.knowledgeAreas.find(a => a.id === editAreaId);
        if (!target) return;
        void journeyService.updateArea({ id: editAreaId, journeyId: journeyId, title, order: target.order, weight: target.weight, expectedQuestions: target.expectedQuestions })
          .then(() => { toast.success('Matéria atualizada!'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível atualizar a matéria.')));
      }}
      onEditNode={(nodeId, knowledgeAreaId, title) => {
        const targetArea = journey?.knowledgeAreas.find(a => a.id === knowledgeAreaId);
        const node = targetArea?.nodes.find(n => n.id === nodeId) ?? targetArea?.nodes.flatMap(n => n.children).find(c => c.id === nodeId);
        if (!node) return;
        void journeyService.updateNode({ id: nodeId, knowledgeAreaId, parentId: node.parentId, title, order: node.order })
          .then(() => { toast.success('Conteúdo atualizado!'); reload(); })
          .catch(error => toast.error(getRequestErrorMessage(error, 'Não foi possível atualizar.')));
      }}
      nodeStudy={nodeStudy}
      onSaveNodeStudy={saveNodeStudy}
      onListResources={nodeId => studyResourceService.list(journeyId, nodeId)}
      onSaveResource={request => studyResourceService.register(request)}
      onDeleteResource={async resourceId => { await studyResourceService.remove(resourceId); }}
      onListAreaResources={knowledgeAreaId => studyResourceService.list(journeyId, undefined, knowledgeAreaId)}
    />
  );
}
