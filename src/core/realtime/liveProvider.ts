import { useCallback, useEffect } from 'react';

export type LiveEventType = 'created' | 'updated' | 'deleted' | 'custom';

export interface LiveEvent<TPayload = unknown> {
  id: string;
  channel: string;
  type: LiveEventType;
  payload?: TPayload;
  timestamp: string;
  meta?: Record<string, unknown>;
  origin?: 'local' | 'remote';
}

interface SubscribeParams {
  channel: string;
  callback: (event: LiveEvent) => void;
  types?: LiveEventType[];
}

interface SubscriptionEntry extends SubscribeParams {
  id: string;
}

export interface PublishParams {
  channel: string;
  type: LiveEventType;
  payload?: unknown;
  meta?: Record<string, unknown>;
  origin?: 'local' | 'remote';
}

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const matchesChannel = (subscriptionChannel: string, eventChannel: string) => {
  if (subscriptionChannel === '*') {
    return true;
  }

  if (subscriptionChannel.endsWith('*')) {
    const prefix = subscriptionChannel.slice(0, -1);
    return eventChannel.startsWith(prefix);
  }

  return subscriptionChannel === eventChannel;
};

const matchesType = (types: LiveEventType[] | undefined, eventType: LiveEventType) =>
  !types || types.length === 0 || types.includes(eventType);

class AtlasLiveProvider {
  private subscriptions = new Map<string, SubscriptionEntry>();

  private broadcastChannel: BroadcastChannel | null = null;

  private ws: WebSocket | null = null;

  private wsEnabled = false;

  private readonly wsUrl = import.meta.env.VITE_REALTIME_WS_URL?.trim() ?? '';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('atlas-live-events');
      this.broadcastChannel.onmessage = (message: MessageEvent<LiveEvent>) => {
        this.emit(message.data);
      };
    }

    this.ensureWebSocket();
  }

  subscribe(params: SubscribeParams): () => void {
    const id = randomId();
    this.subscriptions.set(id, { ...params, id });

    return () => {
      this.subscriptions.delete(id);
    };
  }

  publish(params: PublishParams): LiveEvent {
    const event: LiveEvent = {
      id: randomId(),
      channel: params.channel,
      type: params.type,
      payload: params.payload,
      timestamp: new Date().toISOString(),
      meta: params.meta,
      origin: params.origin ?? 'local',
    };

    this.emit(event);

    if (event.origin !== 'remote') {
      this.broadcastChannel?.postMessage(event);

      if (this.wsEnabled && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      }
    }

    return event;
  }

  private emit(event: LiveEvent) {
    for (const entry of this.subscriptions.values()) {
      if (!matchesChannel(entry.channel, event.channel)) {
        continue;
      }

      if (!matchesType(entry.types, event.type)) {
        continue;
      }

      entry.callback(event);
    }
  }

  private ensureWebSocket() {
    if (this.wsEnabled || !this.wsUrl || typeof window === 'undefined') {
      return;
    }

    this.wsEnabled = true;

    try {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onmessage = (message) => {
        try {
          const parsed = JSON.parse(message.data) as Partial<LiveEvent>;
          if (!parsed.channel || !parsed.type) {
            return;
          }

          this.publish({
            channel: parsed.channel,
            type: parsed.type,
            payload: parsed.payload,
            meta: parsed.meta,
            origin: 'remote',
          });
        } catch (error) {
          console.warn('Realtime: mensagem WS inválida.', error);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.wsEnabled = false;
        window.setTimeout(() => this.ensureWebSocket(), 3000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (error) {
      console.warn('Realtime: falha ao iniciar WebSocket.', error);
      this.wsEnabled = false;
    }
  }
}

export const liveProvider = new AtlasLiveProvider();

type UseLiveSubscriptionParams = SubscribeParams;

export const useLiveSubscription = ({ channel, callback, types }: UseLiveSubscriptionParams) => {
  useEffect(() => {
    const unsubscribe = liveProvider.subscribe({ channel, callback, types });
    return unsubscribe;
  }, [channel, callback, types]);
};

export const useLivePublish = () => {
  return useCallback(
    (params: PublishParams) => liveProvider.publish(params),
    [],
  );
};

export const useSubscription = useLiveSubscription;
export const usePublish = useLivePublish;

const RESOURCE_LABELS: Record<string, string> = {
  avcbs: 'AVCB',
  clcbs: 'CLCB',
  custos_indiretos: 'Custos indiretos',
  lancamentos: 'Lançamentos',
  processos_adm: 'Processos administrativos',
  obras: 'Obras',
};

const toResourceLabel = (resource: string) =>
  RESOURCE_LABELS[resource] ?? resource.replace(/[_-]/g, ' ');

export const publishResourceEvent = (
  resource: string,
  type: Exclude<LiveEventType, 'custom'>,
  payload?: unknown,
) => {
  const actionMap: Record<Exclude<LiveEventType, 'custom'>, string> = {
    created: 'criado',
    updated: 'atualizado',
    deleted: 'removido',
  };

  return liveProvider.publish({
    channel: `resources.${resource}`,
    type,
    payload,
    meta: {
      title: `${toResourceLabel(resource)} ${actionMap[type]}`,
      resource,
      resourceLabel: toResourceLabel(resource),
    },
  });
};
