import dayjs from 'dayjs';

export type ServiceKind = 'AVCB' | 'CLCB' | 'OBRAS' | 'PROCESSOS_ADM';

export interface ServiceSituationConfigItem {
  id: string;
  label: string;
  isDefault?: boolean;
}

export type ServiceSituationConfig = Record<ServiceKind, ServiceSituationConfigItem[]>;

export interface ServiceHistoryEntry {
  id: string;
  serviceKey: string;
  previousSituation: string;
  nextSituation: string;
  changedAt: string;
  responsible: string;
  description: string;
}

export interface ServiceTrackingMeta {
  serviceType?: ServiceKind;
  subtype?: string;
  description?: string;
  phone?: string;
  clientName?: string;
  folderUrl?: string;
  lastSituationChangedAt?: string;
}

type ServiceTrackingMetaMap = Record<string, ServiceTrackingMeta>;
type ServiceTrackingHistoryMap = Record<string, ServiceHistoryEntry[]>;

const CONFIG_STORAGE_KEY = 'atlas.service_tracking.config';
const META_STORAGE_KEY = 'atlas.service_tracking.meta';
const HISTORY_STORAGE_KEY = 'atlas.service_tracking.history';

const defaultConfig: ServiceSituationConfig = {
  AVCB: [
    { id: 'avcb-pendente', label: 'PENDENTE', isDefault: true },
    { id: 'avcb-andamento', label: 'EM_ANDAMENTO' },
    { id: 'avcb-concluido', label: 'CONCLUIDO' },
    { id: 'avcb-cancelado', label: 'CANCELADO' },
  ],
  CLCB: [
    { id: 'clcb-pendente', label: 'PENDENTE', isDefault: true },
    { id: 'clcb-andamento', label: 'EM_ANDAMENTO' },
    { id: 'clcb-concluido', label: 'CONCLUIDO' },
    { id: 'clcb-cancelado', label: 'CANCELADO' },
  ],
  OBRAS: [
    { id: 'obra-orcamento', label: 'ORCAMENTO', isDefault: true },
    { id: 'obra-pendente', label: 'PENDENTE' },
    { id: 'obra-andamento', label: 'EM_ANDAMENTO' },
    { id: 'obra-concluido', label: 'CONCLUIDO' },
    { id: 'obra-cancelado', label: 'CANCELADO' },
  ],
  PROCESSOS_ADM: [
    { id: 'proc-pendente', label: 'PENDENTE', isDefault: true },
    { id: 'proc-andamento', label: 'EM_ANDAMENTO' },
    { id: 'proc-concluido', label: 'CONCLUIDO' },
    { id: 'proc-cancelado', label: 'CANCELADO' },
  ],
};

const safeRead = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getSituationConfig = (): ServiceSituationConfig =>
  safeRead<ServiceSituationConfig>(CONFIG_STORAGE_KEY, defaultConfig);

export const saveSituationConfig = (config: ServiceSituationConfig) => {
  safeWrite(CONFIG_STORAGE_KEY, config);
};

export const getTrackingMetaMap = (): ServiceTrackingMetaMap =>
  safeRead<ServiceTrackingMetaMap>(META_STORAGE_KEY, {});

export const saveTrackingMetaMap = (metaMap: ServiceTrackingMetaMap) => {
  safeWrite(META_STORAGE_KEY, metaMap);
};

export const getTrackingHistoryMap = (): ServiceTrackingHistoryMap =>
  safeRead<ServiceTrackingHistoryMap>(HISTORY_STORAGE_KEY, {});

export const saveTrackingHistoryMap = (historyMap: ServiceTrackingHistoryMap) => {
  safeWrite(HISTORY_STORAGE_KEY, historyMap);
};

export const getDefaultSituationForType = (type: ServiceKind) =>
  getSituationConfig()[type].find((item) => item.isDefault)?.label ?? getSituationConfig()[type][0]?.label ?? 'PENDENTE';

export const createHistoryEntry = (
  serviceKey: string,
  previousSituation: string,
  nextSituation: string,
  responsible: string,
  description: string,
): ServiceHistoryEntry => ({
  id: `${serviceKey}-${Date.now()}`,
  serviceKey,
  previousSituation,
  nextSituation,
  changedAt: dayjs().toISOString(),
  responsible,
  description,
});
