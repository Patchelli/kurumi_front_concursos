import type { StudyRoutineRegisterRequest, StudyRoutineUpdateRequest } from '../dto/request/studyRoutine.request';
import type { StudyRoutineResponse } from '../dto/response/studyRoutine.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';
const findAll = (journeyId: number) => clientRequest<StudyRoutineResponse[]>({ url: '/StudyRoutine/list', method: HttpMethod.Get, axiosConfig: { params: { journeyId } } });
const register = (body: StudyRoutineRegisterRequest) => clientRequest<StudyRoutineResponse>({ url: '/StudyRoutine/register', method: HttpMethod.Post, body });
const update = (body: StudyRoutineUpdateRequest) => clientRequest<StudyRoutineResponse>({ url: '/StudyRoutine/update', method: HttpMethod.Put, body });
export const studyRoutineService = { findAll, register, update };
