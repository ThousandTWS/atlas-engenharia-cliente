import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Drawer,
  Empty,
  List,
  Space,
  Tag,
  Tabs,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNotificationCenter, type NotificationCategory, type NotificationItem } from '../../../core/notifications/NotificationCenterContext';
import { notificationRuleCatalog } from '../../../core/notifications/notificationRules';

const { Paragraph, Text, Title } = Typography;

type NotificationFilter = 'all' | NotificationCategory;

const categoryLabels: Record<NotificationCategory, string> = {
  financial: 'Financeiras',
  technical: 'Técnicas',
};

const typeLabels: Record<NotificationItem['type'], string> = {
  info: 'Informativo',
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Crítico',
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Pendente';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const relativeTime = (isoDate: string) => {
  const now = Date.now();
  const timestamp = new Date(isoDate).getTime();
  const diffMinutes = Math.round((timestamp - now) / 60000);
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};

export const NotificationDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const { token } = theme.useToken();
  const {
    notifications,
    pendingConfirmationCount,
    confirm,
    markAsRead,
    refresh,
  } = useNotificationCenter();

  useEffect(() => {
    if (!open) {
      return;
    }

    void refresh();
  }, [open, refresh]);

  const visibleNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications;
    }

    return notifications.filter((item) => item.category === filter);
  }, [filter, notifications]);

  const ruleSummary = useMemo(
    () => notificationRuleCatalog.map((rule) => `${categoryLabels[rule.category]}: ${rule.label}`),
    [],
  );

  return (
    <>
      <Badge count={pendingConfirmationCount} size="small" offset={[-2, 2]} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Tooltip title="Notificações">
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: '18px' }} />}
            style={{ width: 36, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setOpen(true)}
          />
        </Tooltip>
      </Badge>

      <Drawer
        title="Central de notificações"
        placement="right"
        width={420}
        open={open}
        onClose={() => setOpen(false)}
        className="atlas-notification-drawer atlas-services-drawer"
        extra={<Tag color={pendingConfirmationCount > 0 ? 'gold' : 'green'}>{pendingConfirmationCount} pendentes</Tag>}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card className="atlas-services-filter-card atlas-notification-summary-card" size="small">
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Space size={8}>
                <FilterOutlined style={{ color: token.colorPrimary }} />
                <Text strong>Filtrar notificações</Text>
              </Space>
              <Tabs
                activeKey={filter}
                onChange={(value) => setFilter(value as NotificationFilter)}
                items={[
                  { key: 'all', label: 'Todas' },
                  { key: 'financial', label: 'Financeiras' },
                  { key: 'technical', label: 'Técnicas' },
                ]}
              />
              <Text type="secondary">
                Base preparada para regras automáticas configuráveis. Exemplos ativos: {ruleSummary.join(' • ')}.
              </Text>
            </Space>
          </Card>

          <Card className="atlas-services-table-card atlas-notification-list-card" size="small">
            {visibleNotifications.length === 0 ? (
              <Empty description="Nenhuma notificação nesta categoria." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={visibleNotifications}
                className="atlas-notification-list"
                renderItem={(item) => (
                  <List.Item key={item.id} className="atlas-notification-list-item">
                    <Card
                      size="small"
                      className={`atlas-notification-card${item.confirmedAt ? ' atlas-notification-card-confirmed' : ''}`}
                    >
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={item.category === 'financial' ? 'gold' : 'geekblue'}>
                            {categoryLabels[item.category]}
                          </Tag>
                          <Tag>{typeLabels[item.type]}</Tag>
                          {item.origin === 'automatic' && <Tag color="cyan">Automática</Tag>}
                          {item.confirmedAt && (
                            <Tag color="green" icon={<CheckCircleOutlined />}>
                              Confirmada
                            </Tag>
                          )}
                        </Space>

                        <div>
                          <Title level={5} style={{ marginBottom: 4 }}>
                            {item.title}
                          </Title>
                          {item.description && (
                            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                              {item.description}
                            </Paragraph>
                          )}
                        </div>

                        <Space direction="vertical" size={4}>
                          <Space size={6}>
                            <ClockCircleOutlined />
                            <Text type="secondary">{relativeTime(item.timestamp)}</Text>
                          </Space>
                          <Space size={6}>
                            <CalendarOutlined />
                            <Text type="secondary">Confirmação: {formatDateTime(item.confirmedAt)}</Text>
                          </Space>
                        </Space>

                        <Space wrap>
                          {!item.read && (
                            <Button className="atlas-services-button" size="small" onClick={() => markAsRead(item.id)}>
                              Marcar como lida
                            </Button>
                          )}
                          <Button
                            className={item.confirmedAt ? 'atlas-services-button' : 'atlas-services-button atlas-services-button-primary'}
                            size="small"
                            disabled={Boolean(item.confirmedAt)}
                            onClick={() => confirm(item.id)}
                          >
                            {item.confirmedAt ? 'Confirmada' : 'Confirmar notificação'}
                          </Button>
                        </Space>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Space>
      </Drawer>
    </>
  );
};
