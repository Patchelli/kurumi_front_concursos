import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
export type JourneyViewProps = {
  journey: JourneyDetailsResponse | null;
  loading: boolean;
  onBack(): void;
  onAddArea(): void;
  onRemoveArea(id: string): void;
  onAddTopic(areaId: string, order: number): void;
  onAddSubtopic(areaId: string, parentId: string, order: number): void;
  onRemoveNode(id: string): void;
  onCreateFlashcard(): void;
  onOpenPomodoro(): void;
};
