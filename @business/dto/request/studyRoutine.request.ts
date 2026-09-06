import type { ERoutineKind } from '../../enum/ERoutineKind';

export type StudyRoutineConfigurationRequest = {
  knowledgeAreaIds: number[];
  affinity: Record<number, string>;
  hoursPerTopic: number;
  availability: Record<string, number>;
  areaHoursOverride: Record<number, number>;
  nodeHoursOverride: Record<number, number>;
  automaticAdaptationEnabled: boolean;
  adaptationAccuracyThreshold: number;
  adaptationMinimumQuestions: number;
  adaptationFlashcardErrorThreshold: number;
};

export type StudyRoutineRegisterRequest = {
  journeyId: number;
  title: string;
  kind: ERoutineKind;
  configuration: StudyRoutineConfigurationRequest;
};

export type StudyRoutineUpdateRequest = StudyRoutineRegisterRequest & { id: number };
