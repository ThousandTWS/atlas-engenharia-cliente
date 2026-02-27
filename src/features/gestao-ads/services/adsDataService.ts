import dayjs from 'dayjs';
import { AdsEndpointTemplate } from './adsEndpointTemplate';
import { normalizeCampaignStatus, normalizeCampaignType } from './adsNormalizationStrategies';
import { formatCurrencyPtBr, formatNumberPtBr } from '../../../core/structural/flyweight/numberFormatterFlyweight';

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

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.-]/g, '');
    const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const pickNumber = (record: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    if (key in record) {
      return toNumber(record[key]);
    }
  }

  return 0;
};

const pickMicrosAsCurrency = (record: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    if (key in record) {
      return toNumber(record[key]) / 1_000_000;
    }
  }

  return 0;
};

const normalizeDate = (record: Record<string, unknown>): string => {
  const rawValue = record.data ?? record.date ?? record.day ?? record.segmentDate ?? record.segments_date;
  if (rawValue === undefined || rawValue === null) {
    return '';
  }

  const parsed = dayjs(String(rawValue));
  return parsed.isValid() ? parsed.format('DD/MM') : '';
};

const normalizePerformance = (list: unknown[]): PerformancePoint[] =>
  list.map((entry) => {
    const item = asRecord(entry);

    const cost = pickNumber(item, ['custo', 'cost']) || pickMicrosAsCurrency(item, ['costMicros', 'custoMicros']);

    return {
      data: normalizeDate(item),
      cliques: pickNumber(item, ['cliques', 'clicks']),
      impressoes: pickNumber(item, ['impressoes', 'impressions']),
      custo: Number(cost.toFixed(2)),
      conversoes: pickNumber(item, ['conversoes', 'conversions']),
    };
  });

const normalizeCampaigns = (list: unknown[]): CampaignPerformance[] =>
  list.map((entry, index) => {
    const item = asRecord(entry);

    const budget = pickNumber(item, ['orcamento', 'budget', 'dailyBudget']) || pickMicrosAsCurrency(item, ['budgetAmountMicros', 'orcamentoMicros']);
    const cost = pickNumber(item, ['custo', 'cost']) || pickMicrosAsCurrency(item, ['costMicros', 'custoMicros']);

    const id = String(item.id ?? item.campaignId ?? item.campaign_id ?? item.resourceName ?? `campaign-${index}`);
    const nome = String(item.nome ?? item.name ?? item.campaignName ?? item.campaign_name ?? `Campanha ${index + 1}`);

    return {
      id,
      nome,
      tipo: normalizeCampaignType(item.tipo ?? item.type ?? item.channelType ?? item.advertisingChannelType),
      status: normalizeCampaignStatus(item.status ?? item.state),
      orcamento: Number(budget.toFixed(2)),
      cliques: pickNumber(item, ['cliques', 'clicks']),
      impressoes: pickNumber(item, ['impressoes', 'impressions']),
      custo: Number(cost.toFixed(2)),
      conversoes: pickNumber(item, ['conversoes', 'conversions']),
    };
  });

class PerformanceTimeseriesTemplate extends AdsEndpointTemplate<'7d' | '30d' | '90d', PerformancePoint[]> {
  protected readonly endpointKind = 'performance' as const;

  protected readonly arrayKeys = ['performance', 'timeseries', 'serie'];

  protected buildRequestConfig(period: '7d' | '30d' | '90d') {
    return {
      method: 'GET' as const,
      params: { period },
    };
  }

  protected normalize(list: unknown[], _period: '7d' | '30d' | '90d'): PerformancePoint[] {
    return normalizePerformance(list);
  }

  protected override handleError(error: unknown): void {
    console.error('Dashboard ADS: falha ao obter série temporal', error);
  }
}

class CampaignPerformanceTemplate extends AdsEndpointTemplate<void, CampaignPerformance[]> {
  protected readonly endpointKind = 'campaigns' as const;

  protected readonly arrayKeys = ['campaigns'];

  protected buildRequestConfig(_input: void) {
    return {
      method: 'GET' as const,
    };
  }

  protected normalize(list: unknown[], _input: void): CampaignPerformance[] {
    return normalizeCampaigns(list);
  }

  protected override handleError(error: unknown): void {
    console.error('Dashboard ADS: falha ao obter campanhas', error);
  }
}

const performanceTimeseriesTemplate = new PerformanceTimeseriesTemplate();
const campaignPerformanceTemplate = new CampaignPerformanceTemplate();

export async function fetchPerformanceTimeseries(period: '7d' | '30d' | '90d'): Promise<PerformancePoint[]> {
  return performanceTimeseriesTemplate.execute(period);
}

export async function fetchCampaignPerformance(): Promise<CampaignPerformance[]> {
  return campaignPerformanceTemplate.execute(undefined);
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
    return formatCurrencyPtBr(value, 0);
  }
  return formatNumberPtBr(value, 0);
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
