import type { LoginRequest, RegisterRequest } from '../dto/request/authentication.request';
import type { AuthenticationResponse } from '../dto/response/authentication.response';
import { HttpMethod } from '../enum/httpMethod.enum';
import { clientRequest } from './base/httpHandler.service';

async function login(request: LoginRequest) {
  return clientRequest<AuthenticationResponse>({ url: '/authentication/generate_access_token', method: HttpMethod.Post, instanceType: 'public', body: request });
}

async function register(request: RegisterRequest) {
  return clientRequest<AuthenticationResponse>({ url: '/authentication/register', method: HttpMethod.Post, instanceType: 'public', body: request });
}

export const authenticationService = { login, register };
