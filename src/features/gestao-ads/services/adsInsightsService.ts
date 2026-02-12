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

export async function fetchGeminiInsights(payload: InsightPayload): Promise<GeminiInsight[]> {
  try {
    const response = await apiRequest<GeminiInsight[]>({
      url: '/ads/insights',
      method: 'POST',
      data: payload,
    });

    if (Array.isArray(response)) {
      return response;
    }
  } catch (error) {
    console.error('Dashboard ADS: falha ao obter insights Gemini', error);
  }

  return [];
}

