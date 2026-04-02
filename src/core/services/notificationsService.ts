import { apiRequest } from '../api/apiClient';

export type BackendNotificationCategory = 'FINANCEIRA' | 'TECNICA';
export type BackendNotificationServiceType = 'AVCB' | 'CLCB' | 'OBRAS' | 'PROCESSOS_ADM';

export interface BackendNotification {
  id: number;
  title: string;
  message?: string;
  category: BackendNotificationCategory;
  serviceType?: BackendNotificationServiceType | null;
  amount?: number | null;
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

const toQueryString = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === '') return;
        query.append(key, String(item));
      });
      return;
    }

    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const notificationsService = {
  list(params?: {
    page?: number;
    pageSize?: number;
    category?: BackendNotificationCategory;
    serviceType?: BackendNotificationServiceType;
    serviceTypes?: BackendNotificationServiceType[];
    amountMin?: number;
    amountMax?: number;
    amountGreaterThanZero?: boolean;
  }) {
    return apiRequest<BackendNotificationResponse>({
      url: `/notifications${toQueryString({ page: 1, pageSize: 50, ...params })}`,
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
