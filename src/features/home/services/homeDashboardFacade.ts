import {
  avcbService,
  clcbService,
  custosIndiretosService,
  lancamentosService,
  processosAdmService,
} from '../../../core/services/generic/genericService';
import { obrasService } from '../../../core/services/obras/obrasService';
import { adaptListResponse } from '../../../core/structural/adapter/listResponseAdapter';

type HomeRecord = Record<string, unknown>;

export interface HomeDashboardSnapshot {
  avcbs: HomeRecord[];
  clcbs: HomeRecord[];
  obras: HomeRecord[];
  processos: HomeRecord[];
  lancamentos: HomeRecord[];
  custos: HomeRecord[];
}

interface HomeDashboardFacade {
  getSnapshot(page: number, size: number): Promise<HomeDashboardSnapshot>;
  clearCache(): void;
}

class HomeDashboardFacadeImpl implements HomeDashboardFacade {
  async getSnapshot(page: number, size: number): Promise<HomeDashboardSnapshot> {
    const [avcbs, clcbs, obras, processos, lancamentos, custos] = await Promise.all([
      avcbService.getAll({ page, size }),
      clcbService.getAll({ page, size }),
      obrasService.getAll({ page, size }),
      processosAdmService.getAll({ page, size }),
      lancamentosService.getAll({ page, size }),
      custosIndiretosService.getAll({ page, size }),
    ]);

    return {
      avcbs: adaptListResponse<HomeRecord>(avcbs),
      clcbs: adaptListResponse<HomeRecord>(clcbs),
      obras: adaptListResponse<HomeRecord>(obras),
      processos: adaptListResponse<HomeRecord>(processos),
      lancamentos: adaptListResponse<HomeRecord>(lancamentos),
      custos: adaptListResponse<HomeRecord>(custos),
    };
  }

  clearCache(): void {}
}

class CachedHomeDashboardFacadeProxy implements HomeDashboardFacade {
  private readonly target: HomeDashboardFacade;

  private readonly ttlMs: number;

  private readonly cache = new Map<string, { expiresAt: number; value: HomeDashboardSnapshot }>();

  private readonly inflight = new Map<string, Promise<HomeDashboardSnapshot>>();

  constructor(target: HomeDashboardFacade, ttlMs = 12_000) {
    this.target = target;
    this.ttlMs = ttlMs;
  }

  async getSnapshot(page: number, size: number): Promise<HomeDashboardSnapshot> {
    const key = `snapshot:${page}:${size}`;
    const now = Date.now();

    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const request = this.target.getSnapshot(page, size)
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

    this.inflight.set(key, request);
    return request;
  }

  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
  }
}

export const homeDashboardFacade: HomeDashboardFacade = new CachedHomeDashboardFacadeProxy(
  new HomeDashboardFacadeImpl(),
);
