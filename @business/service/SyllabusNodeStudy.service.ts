import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type SyllabusNodeStudyRequest = {
  journeyId: number;
  syllabusNodeId: number;
  completed: boolean;
  studiedMinutes: number;
  scheduleReview: boolean;
  reviewDate?: string | null;
  clearPending?: boolean;
  summary?: string | null;
  studyLocation?: string | null;
  isReview?: boolean;
};

export type SyllabusNodeStudyResponse = {
  syllabusNodeId: number;
  progress: number | string;
  studyStartedOn?: string | null;
  studiedOn?: string | null;
  studiedMinutes: number;
  reviewDate?: string | null;
  latestSummary?: string | null;
  lastStudyLocation?: string | null;
  questionDate?: string | null;
};

const list = (journeyId: number) => clientRequest<SyllabusNodeStudyResponse[]>({
  url: '/journeys/nodes/study',
  method: HttpMethod.Get,
  axiosConfig: { params: { journeyId } },
});

const save = (body: SyllabusNodeStudyRequest) => clientRequest<SyllabusNodeStudyResponse>({
  url: '/journeys/nodes/study',
  method: HttpMethod.Put,
  body,
});

export const syllabusNodeStudyService = { list, save };
