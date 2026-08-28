import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
export type StudyPlanViewProps = { journey: JourneyDetailsResponse | null; loading: boolean; onBack(): void; onOverview(): void; onOpenContent(): void; onOpenCapsule(): void; onOpenSimulados(): void; onOpenSubject(areaId: number): void };
