/* eslint-disable @typescript-eslint/no-unused-vars */
import { liveProvider, type LiveEvent, type LiveEventType } from '../realtime/liveProvider';
import { FirstMatchStrategyResolver, type StrategyMatcher } from '../patterns/strategy';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface OpenNotificationParams {
  title: string;
  description?: string;
  type?: NotificationType;
  showToast?: boolean;
}

const isKnownType = (value: unknown): value is NotificationType =>
  value === 'success' || value === 'warning' || value === 'error' || value === 'info';

const eventTypeStrategy = <TResult>(
  eventType: LiveEventType,
  output: TResult,
): StrategyMatcher<LiveEventType, TResult> => ({
  matches: (value) => value === eventType,
  resolve: () => output,
});

const eventTypeToNotificationTypeResolver = new FirstMatchStrategyResolver<LiveEventType, NotificationType>(
  [
    eventTypeStrategy('created', 'success'),
    eventTypeStrategy('updated', 'info'),
    eventTypeStrategy('deleted', 'warning'),
  ],
  () => 'info',
);

interface NotificationFormatterImplementation {
  format(event: LiveEvent): OpenNotificationParams;
}

abstract class NotificationBridge {
  private readonly implementation: NotificationFormatterImplementation;

  constructor(implementation: NotificationFormatterImplementation) {
    this.implementation = implementation;
  }

  abstract supports(event: LiveEvent): boolean;

  toNotification(event: LiveEvent): OpenNotificationParams {
    return this.implementation.format(event);
  }
}

class ResourceNotificationFormatter implements NotificationFormatterImplementation {
  format(event: LiveEvent): OpenNotificationParams {
    const meta = event.meta ?? {};
    const metaTitle = typeof meta.title === 'string' ? meta.title : '';
    const resourceLabel = typeof meta.resourceLabel === 'string' ? meta.resourceLabel : event.channel;
    const idValue = (event.payload as { id?: string | number } | undefined)?.id;

    const description = idValue !== undefined
      ? `${resourceLabel} #${idValue}`
      : `${resourceLabel}`;

    const metaType = isKnownType(meta.notificationType) ? meta.notificationType : undefined;

    return {
      title: metaTitle || `Evento ${event.type}`,
      description,
      type: metaType ?? eventTypeToNotificationTypeResolver.execute(event.type),
      showToast: false,
    };
  }
}

class FallbackNotificationFormatter implements NotificationFormatterImplementation {
  format(event: LiveEvent): OpenNotificationParams {
    return {
      title: `Evento ${event.type}`,
      description: event.channel,
      type: eventTypeToNotificationTypeResolver.execute(event.type),
      showToast: false,
    };
  }
}

class ResourceNotificationBridge extends NotificationBridge {
  supports(event: LiveEvent): boolean {
    return event.channel.startsWith('resources.');
  }
}

class FallbackNotificationBridge extends NotificationBridge {
  supports(_event: LiveEvent): boolean {
    return true;
  }
}

class NotificationMediator {
  private readonly bridges: NotificationBridge[] = [
    new ResourceNotificationBridge(new ResourceNotificationFormatter()),
    new FallbackNotificationBridge(new FallbackNotificationFormatter()),
  ];

  private resolve(event: LiveEvent): OpenNotificationParams {
    for (const bridge of this.bridges) {
      if (bridge.supports(event)) {
        return bridge.toNotification(event);
      }
    }

    return {
      title: `Evento ${event.type}`,
      description: event.channel,
      type: 'info',
      showToast: false,
    };
  }

  subscribeToResources(
    notify: (params: OpenNotificationParams) => void,
  ): () => void {
    return liveProvider.subscribe({
      channel: 'resources.*',
      callback: (event) => {
        notify(this.resolve(event));
      },
    });
  }
}

export const notificationMediator = new NotificationMediator();
