import { apiRequest } from '../../../core/api/apiClient';
import type { CampaignPerformance, PerformancePoint } from './adsDataService';

export interface GeminiInsight {
  id: string;
  titulo: string;
  recomendacao: string;
  impacto: 'ROI' | 'Orçamento' | 'Criativos' | 'Lances';
  prioridade: 'alta' | 'media' | 'baixa';
}

interface InsightPayload {
  campaigns: CampaignPerformance[];
  performance: PerformancePoint[];
}

type GenericRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is GenericRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toImpact = (value: unknown): GeminiInsight['impacto'] => {
  const normalized = String(value ?? '').toUpperCase();

  if (normalized.includes('BID') || normalized.includes('LANCE')) return 'Lances';
  if (normalized.includes('BUDGET') || normalized.includes('ORÇAMENTO') || normalized.includes('ORCAMENTO')) return 'Orçamento';
  if (normalized.includes('CREATIVE') || normalized.includes('CRIATIVO')) return 'Criativos';

  return 'ROI';
};

const toPriority = (value: unknown): GeminiInsight['prioridade'] => {
  const normalized = String(value ?? '').toUpperCase();

  if (normalized.includes('HIGH') || normalized.includes('ALTA')) return 'alta';
  if (normalized.includes('MEDIUM') || normalized.includes('MEDIA') || normalized.includes('MÉDIA')) return 'media';

  return 'baixa';
};

const normalizeInsight = (item: GenericRecord, index: number): GeminiInsight => ({
  id: String(item.id ?? item.insightId ?? `insight-${index + 1}`),
  titulo: String(item.titulo ?? item.title ?? `Insight ${index + 1}`),
  recomendacao: String(item.recomendacao ?? item.recommendation ?? item.description ?? ''),
  impacto: toImpact(item.impacto ?? item.impact ?? item.category),
  prioridade: toPriority(item.prioridade ?? item.priority),
});

const extractInsightList = (payload: unknown): GeminiInsight[] => {
  if (Array.isArray(payload)) {
    return payload
      .filter((item): item is GenericRecord => isRecord(item))
      .map((item, index) => normalizeInsight(item, index));
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [payload.insights, payload.recommendations, payload.data, payload.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .filter((item): item is GenericRecord => isRecord(item))
        .map((item, index) => normalizeInsight(item, index));
    }
  }

  return [];
};

export async function fetchGeminiInsights(payload: InsightPayload): Promise<GeminiInsight[]> {
  try {
    const response = await apiRequest<unknown>({
      url: '/ads/insights',
      method: 'POST',
      data: payload,
    });

    return extractInsightList(response);
  } catch (error) {
    console.error('Dashboard ADS: falha ao obter insights Gemini', error);
  }

  return [];
}
