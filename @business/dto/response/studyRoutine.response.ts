import type { ERoutineKind } from '../../enum/ERoutineKind';
import type { StudyRoutineConfigurationRequest } from '../request/studyRoutine.request';
export type StudyRoutineResponse = { id: number; journeyId: number; title: string; kind: ERoutineKind; active: boolean; configuration: StudyRoutineConfigurationRequest };
