import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type FlashcardRegisterRequest = {
  journeyId: number;
  knowledgeAreaId: number;
  syllabusNodeId?: number | null;
  model: string;
  type: string;
  front: string;
  back: string;
  correctAnswer?: boolean | null;
};

export type FlashcardResponse = FlashcardRegisterRequest & { id: number; nextReviewOn?: string | null };
export type FlashcardPracticeResponse = {
  totalCards: number;
  reviewCards: number;
  newCards: number;
  correctToday: number;
  cards: FlashcardResponse[];
};

const register = (body: FlashcardRegisterRequest) =>
  clientRequest<FlashcardResponse>({ url: '/Flashcard/register', method: HttpMethod.Post, body });

const practice = (params: { journeyId: number; knowledgeAreaId?: number; syllabusNodeId?: number; includeDescendants?: boolean }) =>
  clientRequest<FlashcardPracticeResponse>({ url: '/Flashcard/practice', method: HttpMethod.Get, axiosConfig: { params } });

const recall = (cardId: number, grade: 1 | 2 | 3 | 4) =>
  clientRequest<FlashcardResponse>({ url: '/Flashcard/recall', method: HttpMethod.Post, body: { cardId, grade } });

const list = (journeyId: number, knowledgeAreaId?: number, syllabusNodeId?: number) =>
  clientRequest<FlashcardResponse[]>({ url: '/Flashcard/list', method: HttpMethod.Get, axiosConfig: { params: { journeyId, knowledgeAreaId, syllabusNodeId } } });

const update = (body: Pick<FlashcardResponse, 'id' | 'model' | 'type' | 'front' | 'back' | 'correctAnswer'>) =>
  clientRequest<FlashcardResponse>({ url: '/Flashcard/update', method: HttpMethod.Put, body });

const remove = (id: number) =>
  clientRequest<boolean>({ url: `/Flashcard/${id}`, method: HttpMethod.Delete });

export const flashcardService = { register, practice, recall, list, update, remove };
