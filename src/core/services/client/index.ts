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