import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
export type SimuladosViewProps = {
  journey: JourneyDetailsResponse | null;
  loading: boolean;
  onBack(): void;
  onOverview(): void;
  onOpenStudyPlan(): void;
  onOpenContent(): void;
  onOpenCapsule(): void;
};
