import {
  computeTotals,
  enrichCampaignMetrics,
  fetchCampaignPerformance,
  fetchPerformanceTimeseries,
  type CampaignPerformance,
  type PerformancePoint,
} from './adsDataService';
import { fetchGeminiInsights, type GeminiInsight } from './adsInsightsService';

export type AdsPeriod = '7d' | '30d' | '90d';

export interface AdsSummarySnapshot {
  campaignsCount: number;
  activeCampaigns: number;
  averageRoas: number;
  totals: {
    cliques: number;
    impressoes: number;
    custo: number;
    conversoes: number;
  };
}

export interface AdsChatContextSnapshot {
  campaigns: CampaignPerformance[];
  performance: PerformancePoint[];
}

interface AdsDashboardFacade {
  getSummary(period: AdsPeriod): Promise<AdsSummarySnapshot>;
  getChatContext(period: AdsPeriod): Promise<AdsChatContextSnapshot>;
  getInsights(period: AdsPeriod): Promise<GeminiInsight[]>;
  clearCache(): void;
}

class AdsDashboardFacadeImpl implements AdsDashboardFacade {
  async getSummary(period: AdsPeriod): Promise<AdsSummarySnapshot> {
    const [performance, campaigns] = await Promise.all([
      fetchPerformanceTimeseries(period),
      fetchCampaignPerformance(),
    ]);

    const totals = computeTotals(performance);
    const enrichedCampaigns = enrichCampaignMetrics(campaigns);
    const averageRoas = enrichedCampaigns.length > 0
      ? enrichedCampaigns.reduce((acc, item) => acc + item.roas, 0) / enrichedCampaigns.length
      : 0;

    return {
      campaignsCount: campaigns.length,
      activeCampaigns: campaigns.filter((campaign) => campaign.status === 'Ativa').length,
      averageRoas,
      totals,
    };
  }

  async getChatContext(period: AdsPeriod): Promise<AdsChatContextSnapshot> {
    const [campaigns, performance] = await Promise.all([
      fetchCampaignPerformance(),
      fetchPerformanceTimeseries(period),
    ]);

    return { campaigns, performance };
  }

  async getInsights(period: AdsPeriod): Promise<GeminiInsight[]> {
    const context = await this.getChatContext(period);
    return fetchGeminiInsights(context);
  }

  clearCache(): void {}
}

class CachedAdsDashboardFacadeProxy implements AdsDashboardFacade {
  private readonly target: AdsDashboardFacade;

  private readonly ttlMs: number;

  private readonly cache = new Map<string, { expiresAt: number; value: unknown }>();

  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(target: AdsDashboardFacade, ttlMs = 12_000) {
    this.target = target;
    this.ttlMs = ttlMs;
  }

  async getSummary(period: AdsPeriod): Promise<AdsSummarySnapshot> {
    return this.resolveWithCache(
      `summary:${period}`,
      () => this.target.getSummary(period),
    );
  }

  async getChatContext(period: AdsPeriod): Promise<AdsChatContextSnapshot> {
    return this.resolveWithCache(
      `chat-context:${period}`,
      () => this.target.getChatContext(period),
    );
  }

  async getInsights(period: AdsPeriod): Promise<GeminiInsight[]> {
    return this.resolveWithCache(
      `insights:${period}`,
      () => this.target.getInsights(period),
    );
  }

  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
  }

  private async resolveWithCache<T>(
    key: string,
    producer: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const request = producer()
      .then((value) => {
        this.cache.set(key, {
          expiresAt: now + this.ttlMs,
          value,
        });
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, request as Promise<unknown>);
    return request;
  }
}

export const adsDashboardFacade: AdsDashboardFacade = new CachedAdsDashboardFacadeProxy(
  new AdsDashboardFacadeImpl(),
);
