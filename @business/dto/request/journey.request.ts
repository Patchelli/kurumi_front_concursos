import type { EJourneyStage } from '../../enum/EJourneyStage';

export type JourneyRegisterDataRequest = {
  title: string;
  institution?: string | null;
  examBoard?: string | null;
  position?: string | null;
  salary?: number | null;
  openings?: number | null;
  noticeUrl?: string | null;
  examDate?: string | null;
  stage: EJourneyStage;
  includeInStatistics: boolean;
  logoUrl?: string | null;
};

export type JourneyUpdateDataRequest = JourneyRegisterDataRequest & { id: number };

export type SyllabusNodeStructureRequest = {
  title: string;
  order: number;
  children: SyllabusNodeStructureRequest[];
};

export type KnowledgeAreaStructureRequest = {
  title: string;
  order: number;
  nodes: SyllabusNodeStructureRequest[];
};

export type JourneyRegisterRequest = JourneyRegisterDataRequest & { knowledgeAreas: KnowledgeAreaStructureRequest[] };

export type JourneyUpdateRequest = JourneyUpdateDataRequest & { knowledgeAreas: KnowledgeAreaStructureRequest[] };

export type KnowledgeAreaRegisterRequest = {
  id?: number | null;
  journeyId: number;
  title: string;
  order: number;
  weight?: number | null;
  expectedQuestions?: number | null;
};

export type SyllabusNodeRegisterRequest = {
  id?: number | null;
  knowledgeAreaId: number;
  parentId?: number | null;
  title: string;
  order: number;
};
