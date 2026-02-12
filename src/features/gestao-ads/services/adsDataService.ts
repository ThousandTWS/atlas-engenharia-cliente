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

const normalizePerformance = (list: any[]): PerformancePoint[] =>
  list.map((item) => ({
    data: item.data
      ? dayjs(item.data).format('DD/MM')
      : item.date
        ? dayjs(item.date).format('DD/MM')
        : '',
    cliques: Number(item.cliques ?? 0),
    impressoes: Number(item.impressoes ?? 0),
    custo: Number(item.custo ?? 0),
    conversoes: Number(item.conversoes ?? 0),
  }));

export async function fetchPerformanceTimeseries(period: '7d' | '30d' | '90d'): Promise<PerformancePoint[]> {
  try {
    const response = await apiRequest<PerformancePoint[] | any[]>({
      url: '/ads/performance',
      method: 'GET',
      params: { period },
    });

    if (Array.isArray(response)) {
      return normalizePerformance(response);
    }
  } catch (error) {
    console.error('Dashboard ADS: falha ao obter série temporal', error);
  }

  return [];
}

export async function fetchCampaignPerformance(): Promise<CampaignPerformance[]> {
  try {
    const response = await apiRequest<CampaignPerformance[] | any[]>({
      url: '/ads/campaigns',
      method: 'GET',
    });

    if (Array.isArray(response)) {
      return response as CampaignPerformance[];
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
