import apiClient from '../../api/apiClient';
import { publishResourceEvent } from '../../realtime/liveProvider';
import type { BaseModule, GenericFilters, PaginatedResponse } from './types';

const serializeQueryParams = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === '') {
          return;
        }
        query.append(key, String(item));
      });
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
};

export const createGenericService = <T extends BaseModule>(endpoint: string) => ({
  resourceKey: endpoint.replace(/^\//, '').replace(/-/g, '_'),
  getAll: async (filters?: GenericFilters) => {
    const response = await apiClient.get<PaginatedResponse<T> | T[]>(endpoint, {
      params: filters,
      paramsSerializer: {
        serialize: serializeQueryParams,
      },
    });
    return response.data;
  },
  getById: async (id: string | number) => {
    const response = await apiClient.get<T>(`${endpoint}/${id}`);
    return response.data;
  },
  create: async (item: T) => {
    const response = await apiClient.post<T>(endpoint, item);
    publishResourceEvent(endpoint.replace(/^\//, '').replace(/-/g, '_'), 'created', response.data);
    return response.data;
  },
  update: async (id: string | number, item: Partial<T>) => {
    const response = await apiClient.put<T>(`${endpoint}/${id}`, item);
    publishResourceEvent(endpoint.replace(/^\//, '').replace(/-/g, '_'), 'updated', response.data);
    return response.data;
  },
  delete: async (id: string | number) => {
    await apiClient.delete(`${endpoint}/${id}`);
    publishResourceEvent(endpoint.replace(/^\//, '').replace(/-/g, '_'), 'deleted', { id });
  },
});

export const avcbService = createGenericService<BaseModule>('/avcbs');
export const clcbService = createGenericService<BaseModule>('/clcbs');
export const custosIndiretosService = createGenericService<BaseModule>('/custos-indiretos');
export const lancamentosService = createGenericService<BaseModule>('/lancamentos');
export const processosAdmService = createGenericService<BaseModule>('/processos-adm');
