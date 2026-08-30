import type { AxiosInstance } from 'axios';
import { AxiosBuilder } from './axios.builder';

// Keep an environment override for local/staging deployments, but make sure
// the published frontend talks to the Concurso API when no build variable is set.
export const baseUrl = import.meta.env.VITE_API_URL || 'https://api-concursos.okurumi.com.br/api';

export interface IAxiosInstances {
  public: AxiosInstance;
  private: AxiosInstance;
}

export type AxiosInstanceName = keyof IAxiosInstances;

export const instances: IAxiosInstances = {
  public: AxiosBuilder.build().withUrl(baseUrl).withDefaultHeader().toDomain().initInstance(),
  private: AxiosBuilder.build().withUrl(baseUrl).withDefaultHeader().toDomain().initInstance(),
};

export const api = instances.private;
