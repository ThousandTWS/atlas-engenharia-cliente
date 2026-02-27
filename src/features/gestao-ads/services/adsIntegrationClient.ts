import axios from 'axios';
import { apiRequest } from '../../../core/api/apiClient';
import { createArrayIterator } from '../../../core/patterns/iterator';

export type AdsEndpointKind = 'performance' | 'campaigns' | 'insights' | 'chat';
export type RequestMethod = 'GET' | 'POST';
type AdsGatewaySource = 'backend' | 'n8n';

export interface AdsRequestConfig {
  method: RequestMethod;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
}

interface AdsGateway {
  request<T>(kind: AdsEndpointKind, config: AdsRequestConfig): Promise<T>;
}

interface N8nAuthStrategy {
  apply(headers: Record<string, string>): void;
}

interface Command<TResult> {
  execute(): Promise<TResult>;
}

abstract class CommandDecorator<TResult> implements Command<TResult> {
  protected readonly wrapped: Command<TResult>;

  constructor(wrapped: Command<TResult>) {
    this.wrapped = wrapped;
  }

  execute(): Promise<TResult> {
    return this.wrapped.execute();
  }
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

class NoAuthStrategy implements N8nAuthStrategy {
  apply(): void {}
}

class BearerAuthStrategy implements N8nAuthStrategy {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  apply(headers: Record<string, string>): void {
    headers.Authorization = `Bearer ${this.token}`;
  }
}

class ApiKeyAuthStrategy implements N8nAuthStrategy {
  private readonly headerName: string;

  private readonly key: string;

  constructor(
    headerName: string,
    key: string,
  ) {
    this.headerName = headerName;
    this.key = key;
  }

  apply(headers: Record<string, string>): void {
    headers[this.headerName] = this.key;
  }
}

const createN8nAuthStrategy = (): N8nAuthStrategy => {
  if (N8N_AUTH_TYPE === 'bearer' && N8N_BEARER_TOKEN) {
    return new BearerAuthStrategy(N8N_BEARER_TOKEN);
  }

  if (N8N_AUTH_TYPE === 'api_key' && N8N_API_KEY) {
    return new ApiKeyAuthStrategy(N8N_API_KEY_HEADER, N8N_API_KEY);
  }

  return new NoAuthStrategy();
};

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

class BackendAdsGateway implements AdsGateway {
  async request<T>(kind: AdsEndpointKind, config: AdsRequestConfig): Promise<T> {
    return apiRequest<T>({
      url: BACKEND_ENDPOINTS[kind],
      method: config.method,
      params: config.params,
      data: config.data,
    });
  }
}

class N8nAdsGateway implements AdsGateway {
  private readonly authStrategy = createN8nAuthStrategy();

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    this.authStrategy.apply(headers);

    return headers;
  }

  async request<T>(kind: AdsEndpointKind, config: AdsRequestConfig): Promise<T> {
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
        headers: this.buildHeaders(),
        timeout: 20000,
      });

      return response.data;
    } catch (error) {
      withHelpfulError(error, kind);
    }
  }
}

const createAdsGateway = (source: AdsGatewaySource): AdsGateway => {
  if (source === 'n8n') {
    return new N8nAdsGateway();
  }

  return new BackendAdsGateway();
};

class AdsGatewayFactory {
  private readonly gateways: Record<AdsGatewaySource, AdsGateway> = {
    backend: createAdsGateway('backend'),
    n8n: createAdsGateway('n8n'),
  };

  create(kind: AdsEndpointKind): AdsGateway {
    const source: AdsGatewaySource = shouldUseN8nForEndpoint(kind) ? 'n8n' : 'backend';
    return this.gateways[source];
  }
}

const adsGatewayFactory = new AdsGatewayFactory();

class AdsRequestCommand<T> implements Command<T> {
  private readonly gateway: AdsGateway;

  private readonly kind: AdsEndpointKind;

  private readonly config: AdsRequestConfig;

  constructor(
    gateway: AdsGateway,
    kind: AdsEndpointKind,
    config: AdsRequestConfig,
  ) {
    this.gateway = gateway;
    this.kind = kind;
    this.config = config;
  }

  execute(): Promise<T> {
    return this.gateway.request<T>(this.kind, this.config);
  }
}

class AdsCommandBus {
  execute<T>(command: Command<T>): Promise<T> {
    return command.execute();
  }
}

const adsCommandBus = new AdsCommandBus();

class TimingCommandDecorator<T> extends CommandDecorator<T> {
  private readonly commandName: string;

  constructor(wrapped: Command<T>, commandName: string) {
    super(wrapped);
    this.commandName = commandName;
  }

  async execute(): Promise<T> {
    const start = performance.now();
    const result = await this.wrapped.execute();

    if (import.meta.env.DEV) {
      const elapsed = Math.round((performance.now() - start) * 100) / 100;
      console.debug(`AdsCommand[${this.commandName}] executado em ${elapsed}ms`);
    }

    return result;
  }
}

class ErrorContextCommandDecorator<T> extends CommandDecorator<T> {
  private readonly commandName: string;

  constructor(wrapped: Command<T>, commandName: string) {
    super(wrapped);
    this.commandName = commandName;
  }

  async execute(): Promise<T> {
    try {
      return await this.wrapped.execute();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AdsCommand[${this.commandName}] falhou: ${error.message}`);
      }

      throw new Error(`AdsCommand[${this.commandName}] falhou.`);
    }
  }
}

export async function requestAdsEndpoint<T>(
  kind: AdsEndpointKind,
  config: AdsRequestConfig,
): Promise<T> {
  const gateway = adsGatewayFactory.create(kind);
  const baseCommand = new AdsRequestCommand<T>(gateway, kind, config);
  const timedCommand = new TimingCommandDecorator(baseCommand, kind);
  const decoratedCommand = new ErrorContextCommandDecorator(timedCommand, kind);
  return adsCommandBus.execute(decoratedCommand);
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

  const keyIterator = createArrayIterator(candidateKeys);
  while (keyIterator.hasNext()) {
    const key = keyIterator.next();
    if (!key) {
      continue;
    }

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
