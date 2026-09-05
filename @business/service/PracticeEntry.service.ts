import { HttpMethod } from "../enum/httpMethod.enum";
import { clientRequest } from "./base/httpHandler.service";
export type PracticeEntry = {
  id: number;
  journeyId: number;
  knowledgeAreaId: number;
  syllabusNodeId?: number | null;
  practiceDate: string;
  questionsAnswered: number;
  correctAnswers: number;
  voidedQuestions: number;
  errorReasons: Record<string, number>;
  notes?: string | null;
};
export type PracticeEntrySave = Omit<PracticeEntry, "id">;
const list = (
  journeyId: number,
  knowledgeAreaId: number,
  syllabusNodeId?: number | null,
) =>
  clientRequest<PracticeEntry[]>({
    url: "/PracticeEntry/list",
    method: HttpMethod.Get,
    axiosConfig: { params: { journeyId, knowledgeAreaId, syllabusNodeId } },
  });
const register = (body: PracticeEntrySave) =>
  clientRequest<PracticeEntry>({
    url: "/PracticeEntry/register",
    method: HttpMethod.Post,
    body,
  });
const update = (id: number, body: PracticeEntrySave) =>
  clientRequest<PracticeEntry>({
    url: `/PracticeEntry/${id}`,
    method: HttpMethod.Put,
    body,
  });
const remove = (id: number) =>
  clientRequest<boolean>({
    url: `/PracticeEntry/${id}`,
    method: HttpMethod.Delete,
  });
export const practiceEntryService = { list, register, update, remove };
