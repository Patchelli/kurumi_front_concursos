import type { JourneyDetailsResponse } from '../../../../@business/dto/response/journey.response';
import type { StudyRoutineConfigurationRequest } from '../../../../@business/dto/request/studyRoutine.request';
export type StudyPlanViewProps = { journey: JourneyDetailsResponse | null; loading: boolean; configuration?: StudyRoutineConfigurationRequest; onSaveConfiguration(configuration: StudyRoutineConfigurationRequest): Promise<void>; onBack(): void; onOverview(): void; onOpenContent(): void; onOpenCapsule(): void; onOpenSimulados(): void; onOpenSubject(areaId: number): void };
