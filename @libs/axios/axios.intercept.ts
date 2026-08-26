import { instances, type IAxiosInstances } from './axios.instances';
import { clearAuthentication, getAccessToken } from '../../src/utils/authenticationStorage';

export function axiosIntercept(instances: IAxiosInstances) {
  instances.private.interceptors.request.use(config => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instances.private.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401) {
      clearAuthentication();
      if (window.location.pathname !== '/entrar') window.location.replace('/entrar');
    }
    return Promise.reject(error);
  });
}

export function configureAxios() {
  axiosIntercept(instances);
}
