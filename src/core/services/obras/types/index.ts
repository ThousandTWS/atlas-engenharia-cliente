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
  codigoIn?: string[];
  nomeCliente?: string;
  nomeClienteIn?: string[];
  endereco?: string;
  servico?: string;
  servicoIn?: string[];
  situacao?: string;
  situacoes?: string[];
  nf?: string;
  dataContratoInicio?: string;
  dataContratoFim?: string;
  dataContratoMes?: string[];
  valorContratoMin?: number;
  valorContratoMax?: number;
  valorContratoMaiorQueZero?: boolean;
  page?: number;
  size?: number;
  sort?: string[];
}