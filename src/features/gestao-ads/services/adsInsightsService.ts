import { AdsEndpointTemplate } from './adsEndpointTemplate';
import type { CampaignPerformance, PerformancePoint } from './adsDataService';
import { normalizeInsightImpact, normalizeInsightPriority } from './adsNormalizationStrategies';

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

const normalizeInsights = (items: unknown[]): GeminiInsight[] =>
  items.map((entry, index) => {
    const item = asRecord(entry);
    const titulo = String(item.titulo ?? item.title ?? item.headline ?? `Insight ${index + 1}`);

    return {
      id: String(item.id ?? item.key ?? `insight-${index}`),
      titulo,
      recomendacao: String(item.recomendacao ?? item.recommendation ?? item.text ?? ''),
      impacto: normalizeInsightImpact(item.impacto ?? item.impact),
      prioridade: normalizeInsightPriority(item.prioridade ?? item.priority),
    };
  }).filter((item) => item.recomendacao.trim().length > 0);

class GeminiInsightsTemplate extends AdsEndpointTemplate<InsightPayload, GeminiInsight[]> {
  protected readonly endpointKind = 'insights' as const;

  protected readonly arrayKeys = ['insights', 'recommendations'];

  protected buildRequestConfig(payload: InsightPayload) {
    return {
      method: 'POST' as const,
      data: payload,
    };
  }

  protected normalize(list: unknown[], _payload: InsightPayload): GeminiInsight[] {
    return normalizeInsights(list);
  }

  protected override handleError(error: unknown): void {
    console.error('Dashboard ADS: falha ao obter insights Gemini', error);
  }
}

const geminiInsightsTemplate = new GeminiInsightsTemplate();

export async function fetchGeminiInsights(payload: InsightPayload): Promise<GeminiInsight[]> {
  return geminiInsightsTemplate.execute(payload);
}
