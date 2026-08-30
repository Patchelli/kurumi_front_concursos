import type { CalendarEventRegisterRequest, CalendarEventUpdateRequest } from '../dto/request/calendar.request';
import type { CalendarEventResponse } from '../dto/response/calendar.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';
const findAll = () => clientRequest<CalendarEventResponse[]>({ url: '/calendar/list', method: HttpMethod.Get });
const register = (body: CalendarEventRegisterRequest) => clientRequest<CalendarEventResponse>({ url: '/calendar/register', method: HttpMethod.Post, body });
const update = (body: CalendarEventUpdateRequest) => clientRequest<boolean>({ url: '/calendar/update', method: HttpMethod.Put, body });
const remove = (id: number) => clientRequest<boolean>({ url: '/calendar/delete', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
export const calendarService = { findAll, register, update, remove };
