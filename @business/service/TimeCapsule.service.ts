import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type TimeCapsule = {
  id: number; journeyId: number; title: string; message: string; videoUrl?: string;
  status: 'SCHEDULED' | 'DELIVERED' | 'OPENED';
  triggerType: 'DATE' | 'SUBJECT_COMPLETED' | 'TOPIC_COMPLETED' | 'SUBTOPIC_COMPLETED' | 'STUDY_HOURS_REACHED' | 'QUESTIONS_REACHED' | 'LEVEL_REACHED';
  triggerReferenceId?: number; triggerReferenceLabel?: string; triggerValue?: number;
  scheduledAt?: string; createdAt: string; deliveredAt?: string; openedAt?: string;
};
export type TimeCapsuleSaveRequest = Omit<TimeCapsule, 'id' | 'createdAt' | 'status' | 'deliveredAt' | 'openedAt'> & { journeyId: number };

const list = (journeyId: number) => clientRequest<TimeCapsule[]>({ url: '/TimeCapsule/list', method: HttpMethod.Get, axiosConfig: { params: { journeyId } } });
const register = (body: TimeCapsuleSaveRequest) => clientRequest<TimeCapsule>({ url: '/TimeCapsule/register', method: HttpMethod.Post, body });
const update = (id: number, body: Omit<TimeCapsuleSaveRequest, 'journeyId'>) => clientRequest<TimeCapsule>({ url: `/TimeCapsule/${id}`, method: HttpMethod.Put, body });
const open = (id: number) => clientRequest<TimeCapsule>({ url: `/TimeCapsule/${id}/open`, method: HttpMethod.Put });
const remove = (id: number) => clientRequest<boolean>({ url: `/TimeCapsule/${id}`, method: HttpMethod.Delete });
export const timeCapsuleService = { list, register, update, open, remove };
export const timeCapsuleProgressChangedEvent = 'kurumi:time-capsule-progress-changed';
export const notifyTimeCapsuleProgressChanged = () => window.dispatchEvent(new Event(timeCapsuleProgressChangedEvent));
