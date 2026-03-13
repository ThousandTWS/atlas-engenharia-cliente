import React, { useMemo } from 'react';
import { List, Avatar, Typography, Badge, Button, Dropdown, Space, theme } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNotificationCenter, type NotificationItem } from '../../../core/notifications/NotificationCenterContext';

const { Text } = Typography;

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

export const NotificationDropdown: React.FC = () => {
  const { useToken } = theme;
  const { token } = useToken();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    remove,
    clear,
  } = useNotificationCenter();

  const topNotifications = useMemo(() => notifications.slice(0, 30), [notifications]);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: token.colorSuccess }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: token.colorWarning }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: token.colorError }} />;
      default:
        return <InfoCircleOutlined style={{ color: token.colorInfo }} />;
    }
  };

  const menuContent = (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        width: 360,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          Notificações
        </Typography.Title>
        <Space size={8}>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead}>
              Marcar lidas
            </Button>
          )}
          {topNotifications.some((item) => item.source === 'client') && (
            <Button type="link" size="small" danger onClick={clear}>
              Limpar locais
            </Button>
          )}
          <Badge count={unreadCount} color={token.colorPrimary} />
        </Space>
      </div>

      <List
        dataSource={topNotifications}
        locale={{ emptyText: 'Nenhuma notificação por enquanto.' }}
        style={{ maxHeight: 420, overflowY: 'auto' }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              backgroundColor: item.read ? 'transparent' : token.colorFillAlter,
            }}
            onClick={() => markAsRead(item.id)}
            actions={[
              item.source === 'client' ? (
                <Button
                  key={`remove-${item.id}`}
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(item.id);
                  }}
                />
              ) : null,
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={getIcon(item.type)} style={{ backgroundColor: 'transparent' }} />}
              title={
                <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Text strong={!item.read}>{item.title}</Text>
                  {!item.read && <Badge status="processing" color={token.colorPrimary} />}
                </Space>
              }
              description={
                <Space orientation="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.description}
                  </Text>
                  <Space size={4}>
                    <ClockCircleOutlined style={{ fontSize: 11, color: token.colorTextDescription }} />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {relativeTime(item.timestamp)}
                    </Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown popupRender={() => menuContent} trigger={['click']} placement="bottomRight">
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '18px' }} />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Badge>
    </Dropdown>
  );
};
