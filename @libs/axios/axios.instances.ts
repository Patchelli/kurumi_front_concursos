import type { AxiosInstance } from 'axios';
import { AxiosBuilder } from './axios.builder';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

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
