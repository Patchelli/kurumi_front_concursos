import type { IClientRequest } from '../../interface/httpHandlerService.interface';
import { instances } from '../../../@libs/axios/axios.instances';

export async function clientRequest<Response>({ url, body, method, instanceType = 'private', axiosConfig }: IClientRequest): Promise<Response> {
  const response = await instances[instanceType](url, { ...axiosConfig, method, data: body });
  return response.data as Response;
}
