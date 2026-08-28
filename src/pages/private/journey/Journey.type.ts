import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
export type JourneyViewProps = {
  journey: JourneyDetailsResponse | null;
  loading: boolean;
  onBack(): void;
  onOpenStudyPlan(): void;
  onAddArea(): void;
  onRemoveArea(id: number): void;
  onAddTopic(areaId: number, order: number): void;
  onAddSubtopic(areaId: number, parentId: number, order: number): void;
  onRemoveNode(id: number): void;
  onCreateFlashcard(): void;
  onOpenPomodoro(): void;
  onOpenContent(): void;
  onOpenCapsule(): void;
  onOpenSimulados(): void;
};
