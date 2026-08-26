import type { AxiosRequestConfig, Method } from 'axios';
import type { AxiosInstanceName } from '../../@libs/axios/axios.instances';

export interface IClientRequest {
  url: string;
  body?: unknown;
  method: Method;
  instanceType?: AxiosInstanceName;
  axiosConfig?: AxiosRequestConfig;
}
