export interface BaseModule {
  id?: number | string;
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