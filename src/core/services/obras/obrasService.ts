import apiClient from '../../api/apiClient';
import { publishResourceEvent } from '../../realtime/liveProvider';
import type { Obra, ObrasFilters, ObrasPaginatedResponse } from './types';

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


export const obrasService = {
  getAll: async (filters?: ObrasFilters) => {
    const response = await apiClient.get<ObrasPaginatedResponse>('/obras', {
      params: filters,
      paramsSerializer: {
        serialize: serializeQueryParams,
      },
    });
    return response.data;
  },

  getDistinct: async (payload: { field: string; limit?: number } & Omit<ObrasFilters, 'page' | 'size' | 'sort'>) => {
    const { field, limit = 500, ...filters } = payload;
    const response = await apiClient.get<string[]>('/obras/distinct', {
      params: { field, limit, ...filters },
      paramsSerializer: {
        serialize: serializeQueryParams,
      },
    });
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await apiClient.get<Obra>(`/obras/${id}`);
    return response.data;
  },
  create: async (obra: Obra) => {
    const response = await apiClient.post<Obra>('/obras', obra);
    publishResourceEvent('obras', 'created', response.data);
    return response.data;
  },
  update: async (id: string | number, obra: Partial<Obra>) => {
    const response = await apiClient.put<Obra>(`/obras/${id}`, obra);
    publishResourceEvent('obras', 'updated', response.data);
    return response.data;
  },
  delete: async (id: string | number) => {
    await apiClient.delete(`/obras/${id}`);
    publishResourceEvent('obras', 'deleted', { id });
  },
};
