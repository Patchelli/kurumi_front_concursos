import type { AdminUserResponse } from '../dto/response/admin.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

const listUsers = () => clientRequest<AdminUserResponse[]>({ url: '/admin/users/list', method: HttpMethod.Get });
const deactivateUser = (userId: string) => clientRequest<boolean>({ url: '/admin/users/deactivate', method: HttpMethod.Put, axiosConfig: { params: { userId } } });
const activateUser = (userId: string) => clientRequest<boolean>({ url: '/admin/users/activate', method: HttpMethod.Put, axiosConfig: { params: { userId } } });

export const adminService = { listUsers, deactivateUser, activateUser };
