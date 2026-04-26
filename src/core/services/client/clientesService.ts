import apiClient from '../../api/apiClient';
import type { Cliente, ClientesFilters, ClientesPaginatedResponse } from '.';

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
