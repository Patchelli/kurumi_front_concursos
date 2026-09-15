import { api } from '../../@libs/axios/axios.instances';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

export type PrivateMaterial = { id: number; topicId: number; name: string; mimeType: string; createdAt: string };
export type NextcloudEntry = { name: string; path: string; isDirectory: boolean; mimeType?: string | null; size?: number | null };
export type PrivateMaterialOwner = 'topic' | 'area';

const ownerPath = (owner: PrivateMaterialOwner, id: number) => owner === 'area' ? `/knowledge-areas/${id}/materials` : `/topics/${id}/materials`;

const listFiles = (path?: string) => clientRequest<NextcloudEntry[]>({ url: '/private-materials/files', method: HttpMethod.Get, axiosConfig: { params: { path } } });
const list = (owner: PrivateMaterialOwner, id: number) => clientRequest<PrivateMaterial[]>({ url: ownerPath(owner, id), method: HttpMethod.Get });
const link = (owner: PrivateMaterialOwner, id: number, nextcloudPath: string) => clientRequest<PrivateMaterial>({ url: ownerPath(owner, id), method: HttpMethod.Post, body: { nextcloudPath } });
const remove = (owner: PrivateMaterialOwner, id: number, materialId: number) => clientRequest<boolean>({ url: `${ownerPath(owner, id)}/${materialId}`, method: HttpMethod.Delete });
const file = (owner: PrivateMaterialOwner, id: number, materialId: number) => api.get<Blob>(`${ownerPath(owner, id)}/${materialId}/file`, { responseType: 'blob' }).then(response => response.data);

export const privateMaterialService = { listFiles, list, link, remove, file };
