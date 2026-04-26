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

export interface SubscribeParams {
  channel: string;
  callback: (event: LiveEvent) => void;
  types?: LiveEventType[];
}

export interface SubscriptionEntry extends SubscribeParams {
  id: string;
}

export interface PublishParams {
  channel: string;
  type: LiveEventType;
  payload?: unknown;
  meta?: Record<string, unknown>;
  origin?: 'local' | 'remote';
}
