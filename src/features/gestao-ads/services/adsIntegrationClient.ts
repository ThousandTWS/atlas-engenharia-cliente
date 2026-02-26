import axios from 'axios';
import { apiRequest } from '../../../core/api/apiClient';

type AdsEndpointKind = 'performance' | 'campaigns' | 'insights' | 'chat';
type RequestMethod = 'GET' | 'POST';

interface AdsRequestConfig {
  method: RequestMethod;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
}

const BACKEND_ENDPOINTS: Record<AdsEndpointKind, string> = {
  performance: '/ads/performance',
  campaigns: '/ads/campaigns',
  insights: '/ads/insights',
  chat: '/ads/chat',
};

const N8N_EXPLICIT_ENDPOINTS: Record<AdsEndpointKind, string | undefined> = {
  performance: import.meta.env.VITE_N8N_ADS_PERFORMANCE_URL?.trim(),
  campaigns: import.meta.env.VITE_N8N_ADS_CAMPAIGNS_URL?.trim(),
  insights: import.meta.env.VITE_N8N_ADS_INSIGHTS_URL?.trim(),
  chat: import.meta.env.VITE_N8N_ADS_CHAT_URL?.trim(),
};

const N8N_BASE_URL = import.meta.env.VITE_N8N_ADS_BASE_URL?.trim() || '';

const N8N_RELATIVE_ENDPOINTS: Record<AdsEndpointKind, string> = {
  performance: import.meta.env.VITE_N8N_ADS_ENDPOINT_PERFORMANCE?.trim() || '/ads/performance',
  campaigns: import.meta.env.VITE_N8N_ADS_ENDPOINT_CAMPAIGNS?.trim() || '/ads/campaigns',
  insights: import.meta.env.VITE_N8N_ADS_ENDPOINT_INSIGHTS?.trim() || '/ads/insights',
  chat: import.meta.env.VITE_N8N_ADS_ENDPOINT_CHAT?.trim() || '/ads/chat',
};

const ADS_DATA_SOURCE = (import.meta.env.VITE_ADS_DATA_SOURCE ?? '').trim().toLowerCase();
const N8N_AUTH_TYPE = (import.meta.env.VITE_N8N_ADS_AUTH_TYPE ?? 'none').trim().toLowerCase();
const N8N_BEARER_TOKEN = import.meta.env.VITE_N8N_ADS_BEARER_TOKEN?.trim();
const N8N_API_KEY = import.meta.env.VITE_N8N_ADS_API_KEY?.trim();
const N8N_API_KEY_HEADER = import.meta.env.VITE_N8N_ADS_API_KEY_HEADER?.trim() || 'x-api-key';

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const joinUrl = (base: string, path: string) => {
  if (!base) {
    return '';
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const resolveN8nEndpoint = (kind: AdsEndpointKind): string | null => {
  const explicitUrl = N8N_EXPLICIT_ENDPOINTS[kind];
  if (explicitUrl) {
    return explicitUrl;
  }

  if (!N8N_BASE_URL) {
    return null;
  }

  return joinUrl(N8N_BASE_URL, N8N_RELATIVE_ENDPOINTS[kind]);
};

const shouldUseN8nForEndpoint = (kind: AdsEndpointKind): boolean => {
  if (ADS_DATA_SOURCE === 'backend') {
    return false;
  }

  if (ADS_DATA_SOURCE === 'n8n') {
    return true;
  }

  return Boolean(resolveN8nEndpoint(kind));
};

const buildN8nHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (N8N_AUTH_TYPE === 'bearer' && N8N_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${N8N_BEARER_TOKEN}`;
  }

  if (N8N_AUTH_TYPE === 'api_key' && N8N_API_KEY) {
    headers[N8N_API_KEY_HEADER] = N8N_API_KEY;
  }

  return headers;
};

function withHelpfulError(error: unknown, kind: AdsEndpointKind): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const rawMessage = (
      error.response?.data as { message?: string; error?: string } | undefined
    )?.message
      ?? (error.response?.data as { message?: string; error?: string } | undefined)?.error
      ?? error.message;
    const message = status ? `[${status}] ${rawMessage}` : rawMessage;
    throw new Error(`Ads (${kind}) via n8n falhou: ${message}`);
  }

  throw error instanceof Error ? error : new Error(`Ads (${kind}) via n8n falhou.`);
}

export async function requestAdsEndpoint<T>(
  kind: AdsEndpointKind,
  config: AdsRequestConfig,
): Promise<T> {
  if (!shouldUseN8nForEndpoint(kind)) {
    return apiRequest<T>({
      url: BACKEND_ENDPOINTS[kind],
      method: config.method,
      params: config.params,
      data: config.data,
    });
  }

  const endpoint = resolveN8nEndpoint(kind);
  if (!endpoint) {
    throw new Error(`Endpoint n8n de Ads não configurado para ${kind}.`);
  }

  if (!isAbsoluteUrl(endpoint)) {
    throw new Error(`URL do n8n inválida para ${kind}: ${endpoint}`);
  }

  try {
    const response = await axios.request<T>({
      url: endpoint,
      method: config.method,
      params: config.params,
      data: config.data,
      headers: buildN8nHeaders(),
      timeout: 20000,
    });

    return response.data;
  } catch (error) {
    withHelpfulError(error, kind);
  }
}

export function extractArrayPayload(payload: unknown, knownKeys: string[] = []): unknown[] {
  if (Array.isArray(payload)) {
    if (payload.length > 0 && payload.every((item) => item && typeof item === 'object' && 'json' in item)) {
      return payload.map((item) => (item as { json?: unknown }).json).filter(Boolean);
    }
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const objectPayload = payload as Record<string, unknown>;
  const candidateKeys = [...knownKeys, 'data', 'items', 'results', 'rows', 'content'];

  for (const key of candidateKeys) {
    const value = objectPayload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (objectPayload.body && typeof objectPayload.body === 'object') {
    return extractArrayPayload(objectPayload.body, knownKeys);
  }

  return [];
}
