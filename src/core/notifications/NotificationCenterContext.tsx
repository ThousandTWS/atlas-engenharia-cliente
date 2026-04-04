/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { App } from "antd";
import {
  notificationMediator,
  type NotificationType,
  type OpenNotificationParams,
} from "./NotificationMediator";
import { authService } from "../services/authService";
import { subscribeUserUpdated } from "../events/userObserver";
import {
  notificationsService,
  type BackendNotification,
  type BackendNotificationCategory,
  type BackendNotificationServiceType,
} from "../services/notificationsService";

export type NotificationCategory = "financial" | "technical";
export type NotificationOrigin = "manual" | "automatic";
type NotificationSource = "client" | "server";
export type NotificationServiceType =
  | "AVCB"
  | "CLCB"
  | "OBRAS"
  | "PROCESSOS_ADM";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: NotificationType;
  category: NotificationCategory;
  serviceType?: NotificationServiceType;
  amount?: number;
  origin: NotificationOrigin;
  ruleId?: string;
  read: boolean;
  confirmedAt?: string;
  source: NotificationSource;
}

interface NotificationCenterContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  pendingConfirmationCount: number;
  open: (params: OpenNotificationParams) => string;
  close: (id: string) => void;
  remove: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  confirm: (id: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
}

const NotificationCenterContext = createContext<
  NotificationCenterContextValue | undefined
>(undefined);

const sortNotifications = (items: NotificationItem[]) =>
  [...items].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeCategory = (category?: string): NotificationCategory =>
  category === "technical" || category === "TECNICA"
    ? "technical"
    : "financial";

const resolveType = (notification: BackendNotification): NotificationType => {
  const title = notification.title.toLowerCase();

  if (title.includes("parado") || title.includes("erro")) {
    return "error";
  }

  if (notification.category === "FINANCEIRA") {
    return "warning";
  }

  return "info";
};

const mapBackendCategory = (
  category: BackendNotificationCategory,
): NotificationCategory => (category === "TECNICA" ? "technical" : "financial");

const mapBackendServiceType = (
  value?: BackendNotificationServiceType | null,
): NotificationServiceType | undefined =>
  value === "AVCB" ||
  value === "CLCB" ||
  value === "OBRAS" ||
  value === "PROCESSOS_ADM"
    ? value
    : undefined;

const parseBrazilianMoney = (raw: string): number | null => {
  const cleaned = raw
    .replaceAll(/\s/g, "")
    .replaceAll("R$", "")
    .replaceAll("BRL", "")
    .trim();

  if (!cleaned) return null;

  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replaceAll(".", "").replace(",", ".")
      : cleaned.includes(",")
        ? cleaned.replace(",", ".")
        : cleaned;

  const value = Number(normalized.replaceAll(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
};

const extractServiceType = (
  text: string,
): NotificationServiceType | undefined => {
  const normalized = text.toUpperCase();

  if (normalized.includes("AVCB")) return "AVCB";
  if (normalized.includes("CLCB")) return "CLCB";
  if (normalized.includes("OBRA") || normalized.includes("OBRAS"))
    return "OBRAS";
  if (
    normalized.includes("PROCESSO") ||
    normalized.includes("PROC") ||
    normalized.includes("ADMINISTRATIV")
  ) {
    return "PROCESSOS_ADM";
  }

  return undefined;
};

const extractAmount = (text: string): number | undefined => {
  const candidates: string[] = [];
  const brlMatches = text.match(/R\\$\\s*[-+]?\\s*[\\d.]+(?:,\\d{1,2})?/g);
  if (brlMatches) candidates.push(...brlMatches);

  const genericMatches = text.match(
    /\\b\\d{1,3}(?:\\.\\d{3})*(?:,\\d{1,2})\\b/g,
  );
  if (genericMatches) candidates.push(...genericMatches);

  for (const raw of candidates) {
    const parsed = parseBrazilianMoney(raw);
    if (parsed !== null) return parsed;
  }

  return undefined;
};

const toNotificationItem = (
  notification: BackendNotification,
): NotificationItem => ({
  id: String(notification.id),
  title: notification.title,
  description: notification.message,
  timestamp: notification.lastActive ?? notification.createdAt,
  type: resolveType(notification),
  category: mapBackendCategory(notification.category),
  serviceType:
    mapBackendServiceType(notification.serviceType) ??
    extractServiceType(`${notification.title} ${notification.message ?? ""}`),
  amount:
    (typeof notification.amount === "number"
      ? notification.amount
      : undefined) ??
    extractAmount(`${notification.title} ${notification.message ?? ""}`),
  origin: "manual",
  read: notification.isRead,
  confirmedAt: notification.confirmedAt ?? undefined,
  source: "server",
});

const isAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.location.pathname.startsWith("/auth/")) {
    return false;
  }

  return Boolean(authService.getCurrentUser());
};

export const NotificationCenterProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { notification } = App.useApp();
  const [serverNotifications, setServerNotifications] = useState<
    NotificationItem[]
  >([]);
  const [clientNotifications, setClientNotifications] = useState<
    NotificationItem[]
  >([]);
  const [pendingServerConfirmationCount, setPendingServerConfirmationCount] =
    useState(0);

  const notifications = useMemo(
    () => sortNotifications([...clientNotifications, ...serverNotifications]),
    [clientNotifications, serverNotifications],
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) {
      setServerNotifications([]);
      setPendingServerConfirmationCount(0);
      return;
    }

    try {
      const response = await notificationsService.list();
      setServerNotifications(response.data.map(toNotificationItem));
      setPendingServerConfirmationCount(response.pendingConfirmationCount);
    } catch (error) {
      console.warn("Falha ao carregar notificações.", error);
    }
  }, []);

  const open = useCallback(
    (params: OpenNotificationParams) => {
      const textForExtraction = `${params.title} ${params.description ?? ""}`;
      const item: NotificationItem = {
        id: `local:${randomId()}`,
        title: params.title,
        description: params.description,
        timestamp: new Date().toISOString(),
        type: params.type ?? "info",
        category: normalizeCategory(params.category),
        serviceType: extractServiceType(textForExtraction),
        amount: extractAmount(textForExtraction),
        origin: params.origin === "automatic" ? "automatic" : "manual",
        ruleId: params.ruleId,
        read: false,
        confirmedAt: undefined,
        source: "client",
      };

      setClientNotifications((current) =>
        sortNotifications([item, ...current]).slice(0, 30),
      );

      if (params.showToast !== false) {
        notification[item.type]({
          message: item.title,
          description: item.description,
        });
      }

      return item.id;
    },
    [notification],
  );

  const remove = useCallback((id: string) => {
    setClientNotifications((current) =>
      current.filter((item) => item.id !== id),
    );
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      const localNotification = clientNotifications.find(
        (item) => item.id === id,
      );

      if (localNotification) {
        setClientNotifications((current) =>
          current.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        );
        return;
      }

      setServerNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      );
      void notificationsService
        .markAsRead(id, true)
        .then((updated) => {
          setServerNotifications((current) =>
            current.map((item) =>
              item.id === id ? toNotificationItem(updated) : item,
            ),
          );
        })
        .catch((error) => {
          console.warn("Falha ao marcar notificação como lida.", error);
          void refresh();
        });
    },
    [clientNotifications, refresh],
  );

  const markAllAsRead = useCallback(() => {
    setClientNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
    setServerNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );

    void notificationsService
      .markAllAsRead()
      .then((updated) => {
        setServerNotifications(updated.map(toNotificationItem));
        void refresh();
      })
      .catch((error) => {
        console.warn(
          "Falha ao marcar todas as notificações como lidas.",
          error,
        );
        void refresh();
      });
  }, [refresh]);

  const confirm = useCallback(
    (id: string) => {
      const localNotification = clientNotifications.find(
        (item) => item.id === id,
      );

      if (localNotification) {
        const confirmedAt = new Date().toISOString();
        setClientNotifications((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  read: true,
                  confirmedAt: item.confirmedAt ?? confirmedAt,
                }
              : item,
          ),
        );
        return;
      }

      setServerNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
                confirmedAt: item.confirmedAt ?? new Date().toISOString(),
              }
            : item,
        ),
      );
      setPendingServerConfirmationCount((current) => Math.max(0, current - 1));

      void notificationsService
        .confirm(id)
        .then((updated) => {
          setServerNotifications((current) =>
            current.map((item) =>
              item.id === id ? toNotificationItem(updated) : item,
            ),
          );
          void refresh();
        })
        .catch((error) => {
          console.warn("Falha ao confirmar notificação.", error);
          void refresh();
        });
    },
    [clientNotifications, refresh],
  );

  const clear = useCallback(() => {
    setClientNotifications([]);
  }, []);

  useEffect(() => {
    void refresh();

    const unsubscribe = subscribeUserUpdated(() => {
      void refresh();
    });

    return unsubscribe;
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = notificationMediator.subscribeToResources((params) => {
      open(params);
    });

    return unsubscribe;
  }, [open]);

  const value = useMemo<NotificationCenterContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      pendingConfirmationCount:
        pendingServerConfirmationCount +
        clientNotifications.filter((item) => !item.confirmedAt).length,
      open,
      close: remove,
      remove,
      markAsRead,
      markAllAsRead,
      confirm,
      clear,
      refresh,
    }),
    [
      clear,
      clientNotifications,
      confirm,
      markAllAsRead,
      markAsRead,
      notifications,
      open,
      pendingServerConfirmationCount,
      refresh,
      remove,
    ],
  );

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
};

export const useNotificationCenter = () => {
  const context = useContext(NotificationCenterContext);

  if (!context) {
    throw new Error(
      "useNotificationCenter deve ser usado dentro de NotificationCenterProvider.",
    );
  }

  return context;
};

export const useNotification = () => {
  const { open, close } = useNotificationCenter();
  return { open, close };
};
