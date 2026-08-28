import type { EJourneyStage } from '../../enum/EJourneyStage';

export type SaveJourneyRequest = {
  id?: number | null;
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

export type SaveSyllabusNodeStructureRequest = {
  title: string;
  order: number;
  children: SaveSyllabusNodeStructureRequest[];
};

export type SaveKnowledgeAreaStructureRequest = {
  title: string;
  order: number;
  nodes: SaveSyllabusNodeStructureRequest[];
};

export type SaveJourneyStructureRequest = {
  journey: SaveJourneyRequest;
  knowledgeAreas: SaveKnowledgeAreaStructureRequest[];
};

export type SaveKnowledgeAreaRequest = {
  id?: number | null;
  journeyId: number;
  title: string;
  order: number;
  weight?: number | null;
  expectedQuestions?: number | null;
};

export type SaveSyllabusNodeRequest = {
  id?: number | null;
  knowledgeAreaId: number;
  parentId?: number | null;
  title: string;
  order: number;
};
