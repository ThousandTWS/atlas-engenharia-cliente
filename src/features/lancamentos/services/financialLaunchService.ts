import apiClient from '../../../core/api/apiClient';

export type FinancialLaunchType = 'ENTRADA' | 'SAIDA';
export type FinancialLaunchStatus = 'PREVISTO' | 'A_PAGAR' | 'PAGO' | 'A_CONFIRMAR';
export type FinancialLaunchOrigin = 'MANUAL' | 'IMPORT_INTER' | 'IMPORT_ASAAS';

export interface FinancialLaunch {
  id: number;
  codigo: string;
  tipo: FinancialLaunchType;
  status: FinancialLaunchStatus;
  origem: FinancialLaunchOrigin;
  cadastroServicoId?: number | null;
  codigoServico?: string | null;
  nomeCliente?: string | null;
  prestadorId?: number | null;
  nomePrestador?: string | null;
  descricao: string;
  data: string;
  valor: number;
  numeroParcela?: number | null;
  dataPrevistaParcela?: string | null;
  formaPagamento?: string | null;
  metodoPagamento?: string | null;
  plataforma?: string | null;
  empresa?: string | null;
  comprovanteUrl?: string | null;
  comprovanteNomeArquivo?: string | null;
  observacao?: string | null;
  faturamento?: number;
  custoDireto?: number;
  lucro?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialLaunchSummary {
  total: number;
  pago: number;
  aPagar: number;
  previsto: number;
}

export interface FinancialLaunchListResponse {
  content: FinancialLaunch[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  resumo: FinancialLaunchSummary;
}

export interface FinancialLaunchFilters {
  busca?: string;
  tipo?: FinancialLaunchType;
  status?: FinancialLaunchStatus;
  dataInicio?: string;
  dataFim?: string;
  formaPagamento?: string;
  codigoServico?: string;
  page?: number;
  size?: number;
}

export interface FinancialLaunchPayload {
  tipo: FinancialLaunchType;
  status: FinancialLaunchStatus;
  origem?: FinancialLaunchOrigin;
  cadastroServicoId?: number | null;
  codigoServico?: string | null;
  nomeCliente?: string | null;
  prestadorId?: number | null;
  nomePrestador?: string | null;
  descricao: string;
  data: string;
  valor: number;
  numeroParcela?: number | null;
  dataPrevistaParcela?: string | null;
  formaPagamento?: string | null;
  metodoPagamento?: string | null;
  plataforma?: string | null;
  empresa?: string | null;
  observacao?: string | null;
}

export interface FinancialImportRow {
  data: string;
  descricao: string;
  valor: number;
  formaPagamento?: string;
  status?: FinancialLaunchStatus;
  codigoServico?: string;
  prestadorId?: number;
  nomePrestador?: string;
  observacao?: string;
}

export interface PdfReceiptParseResult {
  origem: FinancialLaunchOrigin;
  rows: FinancialImportRow[];
}

const emptySummary = (): FinancialLaunchSummary => ({
  total: 0,
  pago: 0,
  aPagar: 0,
  previsto: 0,
});

const toNumber = (value: unknown): number => Number(value || 0);

const computeSummary = (items: FinancialLaunch[]): FinancialLaunchSummary => (
  items.reduce<FinancialLaunchSummary>((acc, item) => {
    const valor = toNumber(item.valor);
    acc.total += valor;

    if (item.status === 'PAGO') {
      acc.pago += valor;
    }
    if (item.status === 'A_PAGAR') {
      acc.aPagar += valor;
    }
    if (item.status === 'PREVISTO') {
      acc.previsto += valor;
    }

    return acc;
  }, emptySummary())
);

const normalizeListResponse = (data: unknown): FinancialLaunchListResponse => {
  if (Array.isArray(data)) {
    const content = data as FinancialLaunch[];
    return {
      content,
      pageNumber: 0,
      pageSize: content.length,
      totalElements: content.length,
      totalPages: 1,
      hasNext: false,
      resumo: computeSummary(content),
    };
  }

  const raw = (data || {}) as Partial<FinancialLaunchListResponse> & { resumo?: FinancialLaunchSummary };
  const content = Array.isArray(raw.content) ? raw.content : [];
  return {
    content,
    pageNumber: toNumber(raw.pageNumber),
    pageSize: toNumber(raw.pageSize || content.length),
    totalElements: toNumber(raw.totalElements || content.length),
    totalPages: toNumber(raw.totalPages || (content.length > 0 ? 1 : 0)),
    hasNext: Boolean(raw.hasNext),
    resumo: raw.resumo || computeSummary(content),
  };
};

export const financialLaunchService = {
  async list(filters: FinancialLaunchFilters) {
    const response = await apiClient.get<FinancialLaunchListResponse | FinancialLaunch[]>('/lancamentos', { params: filters });
    return normalizeListResponse(response.data);
  },

  async getById(id: string | number) {
    const response = await apiClient.get<FinancialLaunch>(`/lancamentos/${id}`);
    return response.data;
  },

  async create(payload: FinancialLaunchPayload) {
    const response = await apiClient.post<FinancialLaunch>('/lancamentos', payload);
    return response.data;
  },

  async update(id: string | number, payload: FinancialLaunchPayload) {
    const response = await apiClient.put<FinancialLaunch>(`/lancamentos/${id}`, payload);
    return response.data;
  },

  async remove(id: string | number) {
    await apiClient.delete(`/lancamentos/${id}`);
  },

  async detectFormat(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ origem: FinancialLaunchOrigin; delimiter: string; isBrazilianFormat: boolean }>('/lancamentos/detect-format', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async importBatch(payload: { origem: FinancialLaunchOrigin; tipo: FinancialLaunchType; rows: FinancialImportRow[] }) {
    const response = await apiClient.post<FinancialLaunch[]>('/lancamentos/import', payload);
    return response.data;
  },

  async parsePdfReceipt(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<PdfReceiptParseResult>('/lancamentos/parse-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadReceipt(id: string | number, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<FinancialLaunch>(`/lancamentos/${id}/comprovante`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
