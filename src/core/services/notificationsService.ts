import { apiRequest } from '../api/apiClient';

export type BackendNotificationCategory = 'FINANCEIRA' | 'TECNICA';

export interface BackendNotification {
  id: number;
  title: string;
  message?: string;
  category: BackendNotificationCategory;
  createdAt: string;
  lastActive: string;
  isRead: boolean;
  confirmedAt?: string | null;
}

export interface BackendNotificationResponse {
  data: BackendNotification[];
  totalPage: number;
  totalData: number;
  pageNumber: number;
  hasNext: boolean;
  pendingConfirmationCount: number;
}

const toQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const notificationsService = {
  list(category?: BackendNotificationCategory) {
    return apiRequest<BackendNotificationResponse>({
      url: `/notifications${toQueryString({ page: 1, pageSize: 50, category })}`,
      method: 'GET',
    });
  },

  markAsRead(id: string | number, read = true) {
    return apiRequest<BackendNotification>({
      url: `/notifications/${id}/read${toQueryString({ read })}`,
      method: 'PATCH',
    });
  },

  markAllAsRead() {
    return apiRequest<BackendNotification[]>({
      url: '/notifications/read-all',
      method: 'PATCH',
    });
  },

  confirm(id: string | number) {
    return apiRequest<BackendNotification>({
      url: `/notifications/${id}/confirm`,
      method: 'PATCH',
    });
  },
};
