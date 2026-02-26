import apiClient from '../api/apiClient';

export interface Cliente {
  id?: number;
  cnpjCpf: string;
  razaoSocial: string;
  nomeContato: string;
  telefone: string;
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface ClientesPaginatedResponse {
  content: Cliente[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ClientesFilters {
  cnpjCpf?: string;
  razaoSocial?: string;
  nomeContato?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export const clientesService = {
  getAll: async (filters?: ClientesFilters) => {
    const response = await apiClient.get<ClientesPaginatedResponse>('/clientes', {
      params: filters,
    });
    return response.data;
  },
  getById: async (id: string | number) => {
    const response = await apiClient.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },
  create: async (cliente: Cliente) => {
    const response = await apiClient.post<Cliente>('/clientes', cliente);
    return response.data;
  },
  update: async (id: string | number, cliente: Partial<Cliente>) => {
    const response = await apiClient.put<Cliente>(`/clientes/${id}`, cliente);
    return response.data;
  },
  delete: async (id: string | number) => {
    await apiClient.delete(`/clientes/${id}`);
  },
};
