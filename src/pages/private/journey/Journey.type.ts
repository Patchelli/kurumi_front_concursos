import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import type { JourneyOverviewResponse } from '../../../../@business/service/JourneyOverview.service';
export type JourneyViewProps = {
  journey: JourneyDetailsResponse | null;
  overview: JourneyOverviewResponse | null;
  loading: boolean;
  onBack(): void;
  onOpenStudyPlan(): void;
  onAddArea(): void;
  onRemoveArea(id: number): void;
  onAddTopic(areaId: number, order: number): void;
  onAddSubtopic(areaId: number, parentId: number, order: number): void;
  onRemoveNode(id: number): void;
  onOpenContent(): void;
  onOpenCapsule(): void;
  onOpenSimulados(): void;
};
