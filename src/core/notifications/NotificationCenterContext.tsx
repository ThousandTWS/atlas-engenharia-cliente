/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { App } from 'antd';
import {
  notificationMediator,
  type NotificationType,
  type OpenNotificationParams,
} from './NotificationMediator';

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
}

interface NotificationCenterContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  open: (params: OpenNotificationParams) => string;
  close: (id: string) => void;
  remove: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
}

const NotificationCenterContext = createContext<NotificationCenterContextValue | undefined>(undefined);

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const NotificationCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notification } = App.useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const open = useCallback((params: OpenNotificationParams) => {
    const id = randomId();
    const item: NotificationItem = {
      id,
      title: params.title,
      description: params.description,
      timestamp: new Date().toISOString(),
      type: params.type ?? 'info',
      read: false,
    };

    setNotifications((current) => [item, ...current].slice(0, 120));

    if (params.showToast !== false) {
      notification[item.type]({
        message: item.title,
        description: item.description,
      });
    }

    return id;
  }, [notification]);

  const remove = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  React.useEffect(() => {
    const unsubscribe = notificationMediator.subscribeToResources((params) => {
      open(params);
    });

    return unsubscribe;
  }, [open]);

  const value = useMemo<NotificationCenterContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    open,
    close: remove,
    remove,
    markAsRead,
    markAllAsRead,
    clear,
  }), [clear, markAllAsRead, markAsRead, notifications, open, remove]);

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
};

export const useNotificationCenter = () => {
  const context = useContext(NotificationCenterContext);

  if (!context) {
    throw new Error('useNotificationCenter deve ser usado dentro de NotificationCenterProvider.');
  }

  return context;
};

export const useNotification = () => {
  const { open, close } = useNotificationCenter();
  return { open, close };
};
