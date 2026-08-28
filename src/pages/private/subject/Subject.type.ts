import type { JourneyDetailsResponse, KnowledgeAreaResponse } from '../../../../@business/dto/response/journey.response';

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
};
