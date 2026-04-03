import React from 'react';
import { App, Avatar, Button, Card, Col, Divider, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { formatPhoneBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

const InfoLine: React.FC<{ label: string; value: string; copyableText?: string }> = ({
  label,
  value,
  copyableText,
}) => {
  const content = (
    <Text
      style={{
        display: 'block',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      copyable={copyableText ? { text: copyableText } : false}
    >
      {value}
    </Text>
  );

  return (
    <div style={{ minWidth: 0 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <Tooltip title={value} placement="topLeft">
        {content}
      </Tooltip>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isDarkMode, isMobile } = useLayout();
  const [user, setUser] = React.useState(authService.getCurrentUser());
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const ok = await authService.hydrateSession();
      if (ok && isMounted) {
        setUser(authService.getCurrentUser());
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      navigate('/auth/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível sair.';
      message.error(errorMessage);
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = user?.nomeCompleto || 'Usuário';
  const email = user?.email || '-';
  const username = user?.username || '-';
  const phone = user?.telefone ? formatPhoneBR(user.telefone) : '-';
  const role = user?.role || '-';

  const initials = React.useMemo(() => {
    const parts = String(displayName || '')
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
    return letters.filter(Boolean).join('');
  }, [displayName]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? 12 : 20 }}>
      <div
        style={{
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space direction="vertical" size={2}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Meu Perfil
          </Title>
          <Text type="secondary">Dados da sua conta.</Text>
        </Space>

        <Space wrap>
          <Button icon={<SettingOutlined />} onClick={() => navigate('/profile/configuracoes')}>
            Configurações
          </Button>
        </Space>
      </div>

      <Card className="atlas-services-filter-card" bordered={false} styles={{ body: { padding: isMobile ? 16 : 18 } }}>
        <Row gutter={[16, 16]} align="middle" wrap>
          <Col flex="none">
            <Avatar
              size={isMobile ? 72 : 84}
              icon={!initials ? <UserOutlined /> : undefined}
              src={user?.profilePictureUrl ?? undefined}
              style={{
                backgroundColor: isDarkMode ? '#1E2A47' : '#E2E8F0',
                color: isDarkMode ? '#E2E8F0' : '#0f172a',
                fontWeight: 700,
              }}
            >
              {initials || undefined}
            </Avatar>
          </Col>

          <Col flex="auto" style={{ minWidth: 0 }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Title level={4} style={{ margin: 0 }}>
                  {displayName}
                </Title>
                {role !== '-' ? (
                  <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                    {role}
                  </Tag>
                ) : null}
              </div>

              <Row gutter={[14, 12]}>
                <Col xs={24} sm={12} md={8}>
                  <InfoLine label="E-mail" value={email} copyableText={user?.email || undefined} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <InfoLine label="Usuário" value={username} copyableText={user?.username || undefined} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <InfoLine label="Telefone" value={phone} />
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button danger icon={<LogoutOutlined />} loading={loggingOut} onClick={() => void onLogout()}>
            Sair
          </Button>
        </div>
      </Card>
    </div>
  );
};
