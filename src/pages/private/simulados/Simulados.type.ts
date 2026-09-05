import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import type { MockAssessment, MockAssessmentSave } from '../../../../@business/service/MockAssessment.service';
export type SimuladosViewProps = {
  journey: JourneyDetailsResponse | null;
  loading: boolean;
  entries: MockAssessment[];
  saving: boolean;
  onSave(id: number | null, request: MockAssessmentSave): Promise<void>;
  onDelete(id: number): Promise<void>;
  onBack(): void;
  onOverview(): void;
  onOpenStudyPlan(): void;
  onOpenContent(): void;
  onOpenCapsule(): void;
};
