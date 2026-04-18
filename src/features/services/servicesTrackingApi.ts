/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from '../../core/api/apiClient';
import type { PaginatedResponse } from '../../core/services/genericService';

export type ServiceKind = 'AVCB' | 'CLCB' | 'OBRAS' | 'PROCESSOS_ADM';

export interface ServiceSituationConfigItem {
  id: number;
  label: string;
  order?: number | null;
  isDefault?: boolean;
  active?: boolean;
  conditions?: ServiceSituationConditionItem[];
}

export interface ServiceSituationConditionItem {
  id: number;
  label: string;
  order?: number | null;
  active?: boolean;
}

export interface ServicePendingCondition {
  id: number;
  label: string;
  done: boolean;
  createdAt?: string;
  doneAt?: string;
}

export type ServiceSituationConfig = Record<ServiceKind, ServiceSituationConfigItem[]>;

export interface ServiceHistoryEntry {
  id: number;
  previousSituation: string;
  nextSituation: string;
  changedAt: string;
  responsible: string;
  description: string;
}

export interface TrackingServiceDto {
  id: number;
  origemId: number;
  tipoServico: ServiceKind;
  codigo: string;
  nomeCliente: string;
  telefone: string;
  subtipo: string;
  situacao: string;
  tempoNaSituacao: number;
  descricao: string;
  valorContrato: number;
  dataContrato: string;
  condicaoPagamento: string;
  aReceber: number;
  recebido: number;
  custos: number;
  folderUrl: string;
  pendencias?: Array<{
    id: number;
    label: string;
    concluida: boolean;
    createdAt?: string;
    concluidaEm?: string;
  }>;
}

interface TrackingServiceHistoryDto {
  id: number;
  situacaoAnterior: string;
  novaSituacao: string;
  descricao: string;
  responsavelNome: string;
  createdAt: string;
}

interface TrackingServiceDetailDto {
  servico: TrackingServiceDto;
  historico: TrackingServiceHistoryDto[];
}

interface TrackingSituationConfigDto {
  id: number;
  tipoServico: ServiceKind;
  nome: string;
  ordem: number | null;
  situacaoInicial: boolean;
  ativo: boolean;
  pendencias?: Array<{
    id: number;
    label: string;
    order: number | null;
    active: boolean;
  }>;
}

export interface TrackingServicesFilters {
  tipoServico?: ServiceKind;
  situacao?: string;
  subtipo?: string;
  nomeCliente?: string;
  codigo?: string;
  page?: number;
  size?: number;
}

export interface TrackingServiceUpdatePayload {
  nomeCliente: string;
  telefone?: string;
  tipoServico: ServiceKind;
  subtipo?: string;
  situacao: string;
  descricao?: string;
  valorContrato?: number;
  dataContrato?: string;
  condicaoPagamento?: string;
  aReceber?: number;
  recebido?: number;
  custos?: number;
  folderUrl?: string;
}

const mapHistory = (item: TrackingServiceHistoryDto): ServiceHistoryEntry => ({
  id: item.id,
  previousSituation: item.situacaoAnterior,
  nextSituation: item.novaSituacao,
  changedAt: item.createdAt,
  responsible: item.responsavelNome,
  description: item.descricao,
});

const mapSituationConfig = (item: TrackingSituationConfigDto): ServiceSituationConfigItem => ({
  id: item.id,
  label: item.nome,
  order: item.ordem,
  isDefault: item.situacaoInicial,
  active: item.ativo,
  conditions: (item.pendencias || []).map((p) => ({
    id: p.id,
    label: p.label,
    order: p.order,
    active: p.active,
  })),
});

const mapPendingCondition = (item: any): ServicePendingCondition => ({
  id: item.id,
  label: item.label,
  done: Boolean(item.concluida),
  createdAt: item.createdAt || '',
  doneAt: item.concluidaEm || '',
});

export const servicesTrackingApi = {
  async getAll(filters?: TrackingServicesFilters) {
    try {
      const response = await apiClient.get<PaginatedResponse<TrackingServiceDto>>('/acompanhamento-servicos', {
        params: filters,
        timeout: 60000,
      });
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
      if (!message.includes('timeout')) {
        throw error;
      }

      const retry = await apiClient.get<PaginatedResponse<TrackingServiceDto>>('/acompanhamento-servicos', {
        params: filters,
        timeout: 120000,
      });
      return retry.data;
    }
  },

  async getById(id: string | number) {
    const response = await apiClient.get<TrackingServiceDetailDto>(`/acompanhamento-servicos/${id}`);
    return {
      service: response.data.servico,
      history: response.data.historico.map(mapHistory),
    };
  },

  async update(id: string | number, payload: TrackingServiceUpdatePayload) {
    const response = await apiClient.put<TrackingServiceDto>(`/acompanhamento-servicos/${id}`, payload);
    return response.data;
  },

  async deleteFromSource(input: { type: ServiceKind; origemId: string | number }) {
    const endpointByType: Record<ServiceKind, string> = {
      AVCB: '/avcbs',
      CLCB: '/clcbs',
      OBRAS: '/obras',
      PROCESSOS_ADM: '/processos-adm',
    };
    const endpoint = endpointByType[input.type];
    await apiClient.delete(`${endpoint}/${input.origemId}`);
  },

  async updateSituation(id: string | number, novaSituacao: string, descricao?: string) {
    const response = await apiClient.post<TrackingServiceDetailDto>(`/acompanhamento-servicos/${id}/situacao`, {
      novaSituacao,
      descricao,
    });
    return {
      service: response.data.servico,
      history: response.data.historico.map(mapHistory),
    };
  },

  async getReport(id: string | number) {
    const response = await apiClient.get<TrackingServiceDetailDto>(`/acompanhamento-servicos/${id}/relatorio`);
    return {
      service: response.data.servico,
      history: response.data.historico.map(mapHistory),
    };
  },

  async getSituations(tipoServico: ServiceKind) {
    const response = await apiClient.get<TrackingSituationConfigDto[]>('/acompanhamento-servicos/situacoes', {
      params: { tipoServico },
    });
    return response.data.map(mapSituationConfig);
  },

  async createSituation(tipoServico: ServiceKind, payload: Partial<ServiceSituationConfigItem>) {
    const response = await apiClient.post<TrackingSituationConfigDto>('/acompanhamento-servicos/situacoes', {
      tipoServico,
      nome: payload.label,
      ordem: payload.order ?? null,
      situacaoInicial: Boolean(payload.isDefault),
      ativo: payload.active ?? true,
    });
    return mapSituationConfig(response.data);
  },

  async updateSituationConfig(tipoServico: ServiceKind, item: ServiceSituationConfigItem) {
    const response = await apiClient.put<TrackingSituationConfigDto>(`/acompanhamento-servicos/situacoes/${item.id}`, {
      id: item.id,
      tipoServico,
      nome: item.label,
      ordem: item.order ?? null,
      situacaoInicial: Boolean(item.isDefault),
      ativo: item.active ?? true,
    });
    return mapSituationConfig(response.data);
  },

  async deleteSituationConfig(id: number) {
    await apiClient.delete(`/acompanhamento-servicos/situacoes/${id}`);
  },

  async createSituationCondition(situacaoConfigId: number, payload: { label: string; order?: number | null; active?: boolean }) {
    const response = await apiClient.post<any>(`/acompanhamento-servicos/situacoes/${situacaoConfigId}/pendencias`, {
      id: null,
      label: payload.label,
      order: payload.order ?? null,
      active: payload.active ?? true,
    });
    return {
      id: response.data.id,
      label: response.data.label,
      order: response.data.order ?? null,
      active: Boolean(response.data.active),
    } satisfies ServiceSituationConditionItem;
  },

  async updateSituationCondition(conditionId: number, payload: { label: string; order?: number | null; active?: boolean }) {
    const response = await apiClient.put<any>(`/acompanhamento-servicos/situacoes/pendencias/${conditionId}`, {
      id: conditionId,
      label: payload.label,
      order: payload.order ?? null,
      active: payload.active ?? true,
    });
    return {
      id: response.data.id,
      label: response.data.label,
      order: response.data.order ?? null,
      active: Boolean(response.data.active),
    } satisfies ServiceSituationConditionItem;
  },

  async deleteSituationCondition(conditionId: number) {
    await apiClient.delete(`/acompanhamento-servicos/situacoes/pendencias/${conditionId}`);
  },

  async concludePendingCondition(pendingId: number) {
    const response = await apiClient.post<any>(`/acompanhamento-servicos/pendencias/${pendingId}/concluir`);
    return mapPendingCondition(response.data);
  },
};
