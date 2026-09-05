import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type StudyTimerMode = 'Free' | 'Pomodoro';
export type StudyTimerPhase = 'Focus' | 'ShortBreak' | 'LongBreak';

export type StudyTimerState = {
  id: number;
  journeyId: number;
  knowledgeAreaId: number;
  syllabusNodeId?: number | null;
  mode: StudyTimerMode;
  phase: StudyTimerPhase;
  isRunning: boolean;
  accumulatedFocusSeconds: number;
  currentPhaseSeconds: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cycles: number;
  currentCycle: number;
  serverNow: string;
  phaseCompleted: boolean;
};

export type StudyTimerSaveRequest = Omit<StudyTimerState, 'id' | 'serverNow' | 'phaseCompleted'>;
export const studyTimerFinishedEvent = 'kurumi-study-timer-finished';

const active = () => clientRequest<StudyTimerState | null>({ url: '/StudyTimer/active', method: HttpMethod.Get });
const save = (body: StudyTimerSaveRequest) => clientRequest<StudyTimerState>({ url: '/StudyTimer/active', method: HttpMethod.Put, body });
const finish = (completed: boolean) => clientRequest<boolean>({ url: '/StudyTimer/finish', method: HttpMethod.Post, body: { completed } });
const discard = () => clientRequest<boolean>({ url: '/StudyTimer/active', method: HttpMethod.Delete });

export const studyTimerService = { active, save, finish, discard };
