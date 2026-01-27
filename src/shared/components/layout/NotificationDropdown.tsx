import React from 'react';
import { List, Avatar, Typography, Badge, Button, Dropdown, Space, theme } from 'antd';
import { BellOutlined, ClockCircleOutlined, CheckCircleOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Novo Processo Criado',
    description: 'O processo #1234 foi criado com sucesso.',
    time: '5 min atrás',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'Vencimento de CLCB',
    description: 'O CLCB da unidade Centro vence em 30 dias.',
    time: '2 horas atrás',
    type: 'warning',
    read: false,
  },
  {
    id: '3',
    title: 'Atualização de Obra',
    description: 'A obra "Residencial Park" teve seu status alterado.',
    time: '1 dia atrás',
    type: 'info',
    read: true,
  },
  {
    id: '4',
    title: 'Erro de Sincronização',
    description: 'Não foi possível sincronizar os dados com o servidor.',
    time: '2 dias atrás',
    type: 'error',
    read: true,
  },
];

export const NotificationDropdown: React.FC = () => {
  const { useToken } = theme;
  const { token } = useToken();

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
        width: 350,
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
        <Badge count={mockNotifications.filter(n => !n.read).length} color={token.colorPrimary} />
      </div>

      <List
        dataSource={mockNotifications}
        style={{ maxHeight: 400, overflowY: 'auto' }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              backgroundColor: item.read ? 'transparent' : token.colorFillAlter,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = token.colorFillSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = item.read ? 'transparent' : token.colorFillAlter)}
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
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.description}
                  </Text>
                  <Space size={4} style={{ marginTop: 4 }}>
                    <ClockCircleOutlined style={{ fontSize: '11px', color: token.colorTextDescription }} />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {item.time}
                    </Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <div
        style={{
          padding: '8px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          textAlign: 'center',
        }}
      >
        <Button type="link" size="small" block>
          Ver todas as notificações
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown dropdownRender={() => menuContent} trigger={['click']} placement="bottomRight">
      <Badge count={mockNotifications.filter(n => !n.read).length} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '18px' }} />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Badge>
    </Dropdown>
  );
};
