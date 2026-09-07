import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type RadarPreferences = { region: string; state: string; education: string; role: string; includeNational: boolean };
export type RadarContest = { id: number; title: string; roles: string; education: string; location: string; vacanciesSalary: string; deadline: string | null; daysRemaining: number | null; url: string | null };
export type RadarResult = { contests: RadarContest[]; updatedAt: string };
export const radarService = {
  preferences: () => clientRequest<RadarPreferences>({ url: '/radar/preferences', method: HttpMethod.Get }),
  save: (body: RadarPreferences) => clientRequest<boolean>({ url: '/radar/preferences', method: HttpMethod.Put, body }),
  contests: () => clientRequest<RadarResult>({ url: '/radar/contests', method: HttpMethod.Get }),
};
