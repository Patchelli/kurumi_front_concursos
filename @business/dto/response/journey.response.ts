import type { EJourneyStage } from '../../enum/EJourneyStage';

export type JourneySummaryResponse = {
  id: number;
  title: string;
  institution?: string | null;
  position?: string | null;
  examDate?: string | null;
  stage: EJourneyStage;
  knowledgeAreas: number;
  logoUrl?: string | null;
  includeInStatistics: boolean;
  progress: number;
  readinessLevel: string;
  studiedMinutes: number;
  studyDays: number;
  questionsSolved: number;
  correctAnswers: number;
};

export type JourneyDetailsResponse = Omit<JourneySummaryResponse,
  'knowledgeAreas' | 'progress' | 'readinessLevel' | 'studiedMinutes' | 'studyDays' |
  'questionsSolved' | 'correctAnswers'> & {
  examBoard?: string | null;
  salary?: number | null;
  openings?: number | null;
  noticeUrl?: string | null;
  includeInStatistics: boolean;
  knowledgeAreas: KnowledgeAreaResponse[];
};

export type KnowledgeAreaResponse = {
  id: number;
  title: string;
  order: number;
  weight?: number | null;
  expectedQuestions?: number | null;
  nodes: SyllabusNodeResponse[];
};

export type SyllabusNodeResponse = {
  id: number;
  parentId?: number | null;
  title: string;
  order: number;
  progress: number | string;
  studyStartedOn?: string | null;
  studiedOn?: string | null;
  children: SyllabusNodeResponse[];
};
