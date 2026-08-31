import type { JourneyRegisterRequest, JourneyUpdateRequest, KnowledgeAreaRegisterRequest, SyllabusNodeRegisterRequest } from '../dto/request/journey.request';
import type { JourneyDetailsResponse, JourneySummaryResponse } from '../dto/response/journey.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

const journeyDetailsRequests = new Map<number, Promise<JourneyDetailsResponse>>();
let journeyListRequest: Promise<JourneySummaryResponse[]> | null = null;

function findAll() {
  if (journeyListRequest) return journeyListRequest;

  journeyListRequest = clientRequest<JourneySummaryResponse[]>({ url: '/journeys/list', method: HttpMethod.Get })
    .finally(() => { journeyListRequest = null; });
  return journeyListRequest;
}

async function register(request: JourneyRegisterRequest) {
  return clientRequest<{ id: number }>({ url: '/journeys/register', method: HttpMethod.Post, body: request });
}
async function update(request: JourneyUpdateRequest) {
  return clientRequest<boolean>({ url: '/journeys/update', method: HttpMethod.Put, body: request });
}

function findById(id: number) {
  const pendingRequest = journeyDetailsRequests.get(id);
  if (pendingRequest) return pendingRequest;

  const request = (async () => {
    try {
      return await clientRequest<JourneyDetailsResponse>({
        url: '/journeys/get_by_id',
        method: HttpMethod.Get,
        axiosConfig: { params: { id } },
      });
    } finally {
      journeyDetailsRequests.delete(id);
    }
  })();

  journeyDetailsRequests.set(id, request);
  return request;
}

async function remove(id: number) {
  return clientRequest<void>({ url: '/journeys/delete', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
}

async function addArea(request: KnowledgeAreaRegisterRequest) {
  return clientRequest<boolean>({ url: '/journeys/areas', method: HttpMethod.Post, body: request });
}
async function removeArea(id: number) {
  return clientRequest<boolean>({ url: '/journeys/areas', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
}
async function addNode(request: SyllabusNodeRegisterRequest) {
  return clientRequest<boolean>({ url: '/journeys/nodes', method: HttpMethod.Post, body: request });
}
async function removeNode(id: number) {
  return clientRequest<boolean>({ url: '/journeys/nodes', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
}
export const journeyService = { findAll, findById, register, update, remove, addArea, removeArea, addNode, removeNode };
