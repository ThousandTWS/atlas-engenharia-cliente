/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';
import { apiRequest } from '../../../core/api/apiClient';

export type MetricKey = 'cliques' | 'impressoes' | 'custo' | 'conversoes';

export interface PerformancePoint {
  data: string; // data formatada para eixo (DD/MM)
  cliques: number;
  impressoes: number;
  custo: number;
  conversoes: number;
}

export interface CampaignPerformance {
  id: string;
  nome: string;
  tipo: 'Pesquisa' | 'Display' | 'Vídeo' | 'PMax';
  status: 'Ativa' | 'Limitada' | 'Pausada';
  orcamento: number;
  cliques: number;
  impressoes: number;
  custo: number;
  conversoes: number;
}

export interface AdsDashboardData {
  period: '7d' | '30d' | '90d';
  performance: PerformancePoint[];
  campaigns: CampaignPerformance[];
}

type GenericRecord = Record<string, any>;

const MICROS = 1_000_000;

const isRecord = (value: unknown): value is GenericRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return 0;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const firstDefined = <T>(...values: Array<T | null | undefined>): T | undefined =>
  values.find((value): value is T => value !== null && value !== undefined);

const formatDateLabel = (value: unknown): string => {
  if (!value) return '';
  const parsed = dayjs(value as dayjs.ConfigType);
  return parsed.isValid() ? parsed.format('DD/MM') : '';
};

const extractArray = (payload: unknown, keys: string[] = [], depth = 0): GenericRecord[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload) || depth > 2) {
    return [];
  }

  const orderedKeys = [...keys, 'results', 'items', 'data', 'rows', 'campaigns', 'performance', 'timeseries', 'series'];

  for (const key of orderedKeys) {
    const candidate = payload[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  for (const key of orderedKeys) {
    const candidate = payload[key];
    if (isRecord(candidate)) {
      const nested = extractArray(candidate, [], depth + 1);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
};

const toCampaignType = (value: unknown): CampaignPerformance['tipo'] => {
  const normalized = String(value ?? '').toUpperCase();

  if (normalized.includes('PERFORMANCE_MAX') || normalized.includes('PMAX')) return 'PMax';
  if (normalized.includes('VIDEO') || normalized.includes('VÍDEO')) return 'Vídeo';
  if (normalized.includes('DISPLAY')) return 'Display';
  if (normalized.includes('SEARCH') || normalized.includes('PESQUISA')) return 'Pesquisa';

  return 'Pesquisa';
};

const toCampaignStatus = (value: unknown): CampaignPerformance['status'] => {
  const normalized = String(value ?? '').toUpperCase();

  if (normalized.includes('PAUSED') || normalized.includes('PAUSADA') || normalized.includes('REMOVED')) return 'Pausada';
  if (normalized.includes('LIMIT') || normalized.includes('LEARNING')) return 'Limitada';

  return 'Ativa';
};

const normalizePerformanceItem = (item: GenericRecord): PerformancePoint => {
  const metrics = isRecord(item.metrics) ? item.metrics : {};
  const segments = isRecord(item.segments) ? item.segments : {};

  const directCost = firstDefined(item.custo, item.cost, item.spend, item.gasto, metrics.cost);
  const microsCost = firstDefined(item.custoMicros, item.costMicros, metrics.costMicros);

  return {
    data: formatDateLabel(firstDefined(item.data, item.date, item.day, segments.date, item.segmentDate)),
    cliques: toNumber(firstDefined(item.cliques, item.clicks, metrics.clicks)),
    impressoes: toNumber(firstDefined(item.impressoes, item.impressions, metrics.impressions)),
    custo: directCost !== undefined ? toNumber(directCost) : toNumber(microsCost) / MICROS,
    conversoes: toNumber(firstDefined(item.conversoes, item.conversions, metrics.conversions, metrics.allConversions)),
  };
};

const normalizePerformance = (list: GenericRecord[]): PerformancePoint[] =>
  list.map((item) => normalizePerformanceItem(item));

const normalizeCampaignItem = (item: GenericRecord, index: number): CampaignPerformance => {
  const campaign = isRecord(item.campaign) ? item.campaign : {};
  const budget = isRecord(item.campaignBudget) ? item.campaignBudget : {};
  const metrics = isRecord(item.metrics) ? item.metrics : {};

  const directBudget = firstDefined(item.orcamento, item.budget, item.dailyBudget, budget.amount);
  const microsBudget = firstDefined(item.orcamentoMicros, item.budgetMicros, budget.amountMicros);
  const directCost = firstDefined(item.custo, item.cost, item.spend, metrics.cost);
  const microsCost = firstDefined(item.custoMicros, item.costMicros, metrics.costMicros);

  const id = String(firstDefined(item.id, item.campaignId, campaign.id, index + 1));
  const nome = String(firstDefined(item.nome, item.name, item.campaignName, campaign.name, `Campanha ${index + 1}`));
  const tipo = toCampaignType(firstDefined(item.tipo, item.type, item.campaignType, campaign.advertisingChannelType));
  const status = toCampaignStatus(firstDefined(item.status, item.campaignStatus, campaign.status, campaign.primaryStatus, item.primaryStatus));

  return {
    id,
    nome,
    tipo,
    status,
    orcamento: directBudget !== undefined ? toNumber(directBudget) : toNumber(microsBudget) / MICROS,
    cliques: toNumber(firstDefined(item.cliques, item.clicks, metrics.clicks)),
    impressoes: toNumber(firstDefined(item.impressoes, item.impressions, metrics.impressions)),
    custo: directCost !== undefined ? toNumber(directCost) : toNumber(microsCost) / MICROS,
    conversoes: toNumber(firstDefined(item.conversoes, item.conversions, metrics.conversions, metrics.allConversions)),
  };
};

const normalizeCampaigns = (list: GenericRecord[]): CampaignPerformance[] =>
  list.map((item, index) => normalizeCampaignItem(item, index));

export async function fetchPerformanceTimeseries(period: '7d' | '30d' | '90d'): Promise<PerformancePoint[]> {
  try {
    const response = await apiRequest<unknown>({
      url: '/ads/performance',
      method: 'GET',
      params: { period },
    });

    const list = extractArray(response, ['performance', 'timeseries', 'series']);
    if (list.length) {
      return normalizePerformance(list);
    }

    if (isRecord(response) && (response.date || response.data || response.metrics || response.segments)) {
      return normalizePerformance([response]);
    }
  } catch (error) {
    console.error('Dashboard ADS: falha ao obter série temporal', error);
  }

  return [];
}

export async function fetchCampaignPerformance(): Promise<CampaignPerformance[]> {
  try {
    const response = await apiRequest<unknown>({
      url: '/ads/campaigns',
      method: 'GET',
    });

    const list = extractArray(response, ['campaigns']);
    if (list.length) {
      return normalizeCampaigns(list);
    }

    if (isRecord(response) && (response.id || response.campaign || response.nome || response.name)) {
      return normalizeCampaigns([response]);
    }
  } catch (error) {
    console.error('Dashboard ADS: falha ao obter campanhas', error);
  }

  return [];
}

export function getMetricLabel(metric: MetricKey) {
  const map: Record<MetricKey, string> = {
    cliques: 'Cliques',
    impressoes: 'Impressões',
    custo: 'Custo',
    conversoes: 'Conversões',
  };
  return map[metric];
}

export function formatMetricValue(metric: MetricKey, value: number) {
  if (metric === 'custo') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
}

export function computeTotals(performance: PerformancePoint[]) {
  return performance.reduce(
    (acc, item) => {
      acc.cliques += item.cliques;
      acc.impressoes += item.impressoes;
      acc.custo += item.custo;
      acc.conversoes += item.conversoes;
      return acc;
    },
    { cliques: 0, impressoes: 0, custo: 0, conversoes: 0 }
  );
}

export function enrichCampaignMetrics(campaigns: CampaignPerformance[]) {
  return campaigns.map((campaign) => {
    const ctr = campaign.impressoes > 0 ? (campaign.cliques / campaign.impressoes) * 100 : 0;
    const cpc = campaign.cliques > 0 ? campaign.custo / campaign.cliques : 0;
    const taxaConversao = campaign.cliques > 0 ? (campaign.conversoes / campaign.cliques) * 100 : 0;
    const receitaEstimativa = campaign.conversoes * 240;
    const roas = campaign.custo > 0 ? receitaEstimativa / campaign.custo : 0;

    return {
      ...campaign,
      ctr,
      cpc,
      taxaConversao,
      receitaEstimativa,
      roas,
    };
  });
}
