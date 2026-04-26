import type { NotificationCategory } from "../NotificationCenterContext";
import type { NotificationType } from "../NotificationMediator";
import type { BackendNotificationCategory, BackendNotificationServiceType } from "../notificationsService";

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

export interface NotificationRulePreview {
  id: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
}