import apiClient from '../api/apiClient';
import { publishResourceEvent } from '../realtime/liveProvider';

export interface BaseModule {
  id?: number | string;
  // Campos comuns a módulos tipo AVCB/CLCB
  situacao?: string;
  descricaoSituacao?: string;
  valorContrato?: number;
  dataContrato?: string;
  nf?: string;
  descontoNf?: number;
  condicaoPagamento?: string;
  aReceber?: number;
  recebido?: number;
  custos?: number;
  // Campos comuns a módulos tipo Custos Indiretos/Lançamentos
  data?: string;
  descricao?: string;
  valor?: number;
  categoria?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface GenericFilters {
  page?: number;
  size?: number;
  sort?: string[];
  [key: string]: unknown;
}

export const createGenericService = <T extends BaseModule>(endpoint: string) => ({
  resourceKey: endpoint.replace(/^\//, '').replace(/-/g, '_'),
  getAll: async (filters?: GenericFilters) => {
    // Se o endpoint for um dos que agora suportam paginação no backend
    const response = await apiClient.get<PaginatedResponse<T> | T[]>(endpoint, {
      params: filters,
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
