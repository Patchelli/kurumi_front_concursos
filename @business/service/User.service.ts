import type { ChangePasswordRequest, UpdatePersonalDataRequest } from '../dto/request/user.request';
import type { UserProfileResponse } from '../dto/response/user.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

async function getMyProfile() {
  return clientRequest<UserProfileResponse>({ url: '/user/me', method: HttpMethod.Get });
}

async function updatePersonalData(request: UpdatePersonalDataRequest) {
  return clientRequest<boolean>({ url: '/user/me/personal-data', method: HttpMethod.Put, body: request });
}

async function changePassword(request: ChangePasswordRequest) {
  return clientRequest<boolean>({ url: '/user/change_password', method: HttpMethod.Post, body: request });
}

export const userService = { getMyProfile, updatePersonalData, changePassword };
