import apiClient from '../api/apiClient';
import { publishResourceEvent } from '../realtime/liveProvider';

export interface Obra {
  id?: number;
  codigo?: string;
  nomeCliente: string;
  endereco?: string;
  telefone?: string;
  servico: string;
  situacao: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  descricaoSituacao?: string;
  valorContrato: number;
  dataContrato: string;
  nf?: string;
  condicaoPagamento?: string;
  aReceber?: number;
  recebido?: number;
  custos?: number;
}

export interface ObrasPaginatedResponse {
  content: Obra[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ObrasFilters {
  codigo?: string;
  nomeCliente?: string;
  endereco?: string;
  servico?: string;
  situacao?: string;
  nf?: string;
  dataContratoInicio?: string;
  dataContratoFim?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export const obrasService = {
  getAll: async (filters?: ObrasFilters) => {
    const response = await apiClient.get<ObrasPaginatedResponse>('/obras', {
      params: filters,
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
