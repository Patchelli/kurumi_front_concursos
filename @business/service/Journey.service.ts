import type { SaveJourneyStructureRequest, SaveKnowledgeAreaRequest, SaveSyllabusNodeRequest } from '../dto/request/journey.request';
import type { JourneyDetailsResponse, JourneySummaryResponse } from '../dto/response/journey.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

async function findAll() {
  return clientRequest<JourneySummaryResponse[]>({ url: '/journeys/list', method: HttpMethod.Get });
}

async function register(request: SaveJourneyStructureRequest) {
  return clientRequest<{ id: string }>({ url: '/journeys/register', method: HttpMethod.Post, body: request });
}
async function update(request: SaveJourneyStructureRequest) {
  return clientRequest<boolean>({ url: '/journeys/update', method: HttpMethod.Put, body: request });
}

async function findById(id: string) {
  return clientRequest<JourneyDetailsResponse>({ url: '/journeys/get_by_id', method: HttpMethod.Get, axiosConfig: { params: { id } } });
}

async function remove(id: string) {
  return clientRequest<void>({ url: '/journeys/delete', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
}

async function addArea(request: SaveKnowledgeAreaRequest) {
  return clientRequest<boolean>({ url: '/journeys/areas', method: HttpMethod.Post, body: request });
}
async function removeArea(id: string) {
  return clientRequest<boolean>({ url: '/journeys/areas', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
}
async function addNode(request: SaveSyllabusNodeRequest) {
  return clientRequest<boolean>({ url: '/journeys/nodes', method: HttpMethod.Post, body: request });
}
async function removeNode(id: string) {
  return clientRequest<boolean>({ url: '/journeys/nodes', method: HttpMethod.Delete, axiosConfig: { params: { id } } });
}

export const journeyService = { findAll, findById, register, update, remove, addArea, removeArea, addNode, removeNode };
