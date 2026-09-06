import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type JourneyOverviewSummary = { studiedMinutes:number; questions:number; correctAnswers:number; accuracy:number|null; studyDays:number; completedTopics:number; totalTopics:number; completedSubtopics:number; totalSubtopics:number; todayMinutes:number; todayQuestions:number; todayAccuracy:number|null; todaySessions:number; studyStreak:number };
export type JourneyOverviewReadiness = { score:number; level:string; coverage:number; application:number; retention:number; consistency:number };
export type JourneyOverviewDay = { dayOfWeek:number; studiedMinutes:number; questions:number; accuracy:number|null };
export type JourneyOverviewWeek = { label:string; accuracy:number|null; retention:number|null };
export type JourneyOverviewTopic = { id:number; title:string; coverage:number; accuracy:number|null };
export type JourneyOverviewArea = { id:number; title:string; studiedMinutes:number; coverage:number; questions:number; correctAnswers:number; accuracy:number|null; errors:number; errorsWithReason:number; predominantError:string|null; predominantErrorCount:number; predominantErrorPercentage:number|null; flashcards:number; reviews:number; recall:number|null; topics:JourneyOverviewTopic[] };
export type JourneyOverviewError = { reason:string; count:number; percentage:number };
export type JourneyOverviewResponse = { summary:JourneyOverviewSummary; readiness:JourneyOverviewReadiness; days:JourneyOverviewDay[]; weeks:JourneyOverviewWeek[]; areas:JourneyOverviewArea[]; errors:JourneyOverviewError[] };

const find = (journeyId:number) => clientRequest<JourneyOverviewResponse>({ url:'/JourneyOverview/get', method:HttpMethod.Get, axiosConfig:{ params:{ journeyId } } });
export const journeyOverviewService = { find };
