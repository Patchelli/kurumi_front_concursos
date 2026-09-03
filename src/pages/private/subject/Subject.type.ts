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
  onAddArea(title: string): void;
  onEditArea(areaId: number, title: string): void;
  onDeleteArea(areaId: number): void;
  onListResources(knowledgeAreaId: number): Promise<StudyResource[]>;
  onSaveResource(request: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDeleteResource(id: number): Promise<void>;
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
  onDeleteArea(areaId: number): void;
  onAddTopic(areaId: number, title: string): void;
  onAddSubtopic(areaId: number, parentId: number, title: string): void;
  onEditArea(areaId: number, title: string): void;
  onEditNode(nodeId: number, knowledgeAreaId: number, title: string): void;
  nodeStudy: SyllabusNodeStudyResponse[];
  onSaveNodeStudy(request: SyllabusNodeStudyRequest): Promise<SyllabusNodeStudyResponse>;
  onListResources(nodeId: number): Promise<StudyResource[]>;
  onSaveResource(request: StudyResourceRegisterRequest): Promise<StudyResource>;
  onDeleteResource(id: number): Promise<void>;
  onListAreaResources(knowledgeAreaId: number): Promise<StudyResource[]>;
};
