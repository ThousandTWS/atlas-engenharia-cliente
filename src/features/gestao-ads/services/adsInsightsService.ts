import { extractArrayPayload, requestAdsEndpoint } from './adsIntegrationClient';
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

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;

const normalizeImpact = (value: unknown): GeminiInsight['impacto'] => {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized.includes('orc')) {
    return 'Orçamento';
  }

  if (normalized.includes('lance') || normalized.includes('bid')) {
    return 'Lances';
  }

  if (normalized.includes('criativo') || normalized.includes('creative')) {
    return 'Criativos';
  }

  return 'ROI';
};

const normalizePriority = (value: unknown): GeminiInsight['prioridade'] => {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'alta' || normalized === 'high') {
    return 'alta';
  }

  if (normalized === 'baixa' || normalized === 'low') {
    return 'baixa';
  }

  return 'media';
};

const normalizeInsights = (items: unknown[]): GeminiInsight[] =>
  items.map((entry, index) => {
    const item = asRecord(entry);
    const titulo = String(item.titulo ?? item.title ?? item.headline ?? `Insight ${index + 1}`);

    return {
      id: String(item.id ?? item.key ?? `insight-${index}`),
      titulo,
      recomendacao: String(item.recomendacao ?? item.recommendation ?? item.text ?? ''),
      impacto: normalizeImpact(item.impacto ?? item.impact),
      prioridade: normalizePriority(item.prioridade ?? item.priority),
    };
  }).filter((item) => item.recomendacao.trim().length > 0);

export async function fetchGeminiInsights(payload: InsightPayload): Promise<GeminiInsight[]> {
  try {
    const response = await requestAdsEndpoint<unknown>('insights', {
      method: 'POST',
      data: payload,
    });

    const list = extractArrayPayload(response, ['insights', 'recommendations']);
    return normalizeInsights(list);
  } catch (error) {
    console.error('Dashboard ADS: falha ao obter insights Gemini', error);
  }

  return [];
}
