import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type StudyResourceKind = 1 | 2 | 3 | 5 | 99;

export type StudyResource = {
  id: number;
  journeyId: number;
  knowledgeAreaId?: number | null;
  syllabusNodeId?: number | null;
  title: string;
  url: string;
  kind: StudyResourceKind;
};

export type StudyResourceRegisterRequest = {
  journeyId: number;
  knowledgeAreaId?: number | null;
  syllabusNodeId?: number | null;
  title: string;
  url: string;
  kind: StudyResourceKind;
};

const register = (body: StudyResourceRegisterRequest) =>
  clientRequest<StudyResource>({ url: '/StudyResource/register', method: HttpMethod.Post, body });

const list = (journeyId: number, syllabusNodeId?: number) =>
  clientRequest<StudyResource[]>({
    url: '/StudyResource/list',
    method: HttpMethod.Get,
    axiosConfig: { params: { journeyId, ...(syllabusNodeId ? { syllabusNodeId } : {}) } },
  });

const remove = (id: number) =>
  clientRequest<boolean>({ url: `/StudyResource/${id}`, method: HttpMethod.Delete });

export const studyResourceService = { register, list, remove };
