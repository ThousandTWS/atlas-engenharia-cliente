/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://backend-atlas-engenharia-production-326c.up.railway.app/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {

    if (error.response?.status === 401) {
      console.error('Token expirado ou inv�lido. Redirecionando para login...');
      
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }

    if (error.response?.status === 403) {
      console.error('Erro 403: Acesso negado. Verifique as permiss�es do usu�rio.');
    }

    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Erro na requisi��o';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

export async function apiRequest<T>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const { method = 'GET', body, ...rest } = options;

  const response = await apiClient.request({
    url: endpoint,
    method,
    data: body ? JSON.parse(body) : undefined,
    ...rest,
  });

  return response.data;
}
