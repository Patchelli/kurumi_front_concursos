import type { JourneyDetailsResponse, KnowledgeAreaResponse } from '../../../../@business/dto/response/journey.response';
import type { StudyResource, StudyResourceRegisterRequest } from '@business/service/StudyResource.service';
import type { SyllabusNodeStudyRequest, SyllabusNodeStudyResponse } from '@business/service/SyllabusNodeStudy.service';

export type SubjectListViewProps = {
  journey: JourneyDetailsResponse | null;
  loading: boolean;
  onBack(): void;
  onOpenStudyPlan(): void;
  onOpenOverview(): void;
  onOpenCapsule(): void;
  onOpenSimulados(): void;
  onSelectArea(areaId: number): void;
};

export type SubjectDetailViewProps = {
  journey: JourneyDetailsResponse | null;
  area: KnowledgeAreaResponse | null;
  loading: boolean;
  onBack(): void;
  onBackToList(): void;
  onOpenStudyPlan(): void;
  onOpenOverview(): void;
  onOpenCapsule(): void;
  onOpenSimulados(): void;
  onRemoveNode(id: number): void;
  nodeStudy: SyllabusNodeStudyResponse[];
  onSaveNodeStudy(request: SyllabusNodeStudyRequest): Promise<SyllabusNodeStudyResponse>;
  onListResources(nodeId: number): Promise<StudyResource[]>;
  onSaveResource(request: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDeleteResource(id: number): Promise<void>;
};
