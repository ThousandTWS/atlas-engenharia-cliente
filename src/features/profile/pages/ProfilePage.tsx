import React from 'react';
import { App, Avatar, Button, Card, Col, Descriptions, Divider, Row, Space, Tag, Typography } from 'antd';
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { useUiPreferences } from '../../../shared/components/layout/uiPreferences';
import { formatPhoneBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isDarkMode, isMobile } = useLayout();
  const { preferences } = useUiPreferences();
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
  const enabled = user?.enabled ?? true;

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
          <Text type="secondary">Dados da sua conta e preferências de interface.</Text>
        </Space>

        <Space wrap>
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate('/profile/configuracoes')}
          >
            Configurações
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="atlas-services-filter-card"
            bordered={false}
            styles={{ body: { padding: isMobile ? 16 : 18 } }}
          >
            <div
              style={{
                padding: isMobile ? 14 : 16,
                borderRadius: 12,
                border: '1px solid var(--atlas-border-color, rgba(148,163,184,.35))',
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(30,41,59,.60), rgba(2,6,23,.55))'
                  : 'linear-gradient(135deg, rgba(248,250,252,1), rgba(226,232,240,.65))',
              }}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col flex="none">
                  <Avatar
                    size={isMobile ? 72 : 84}
                    icon={!initials ? <UserOutlined /> : undefined}
                    src={user?.profilePictureUrl ?? undefined}
                    style={{
                      backgroundColor: isDarkMode ? '#1E2A47' : '#E2E8F0',
                      border: `3px solid ${isDarkMode ? '#111827' : '#FFFFFF'}`,
                      color: isDarkMode ? '#E2E8F0' : '#0f172a',
                      fontWeight: 700,
                    }}
                  >
                    {initials || undefined}
                  </Avatar>
                </Col>

                <Col flex="auto">
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Title level={4} style={{ margin: 0 }}>
                        {displayName}
                      </Title>
                      <Tag color={enabled ? 'green' : 'red'} style={{ marginInlineEnd: 0 }}>
                        {enabled ? 'Ativo' : 'Inativo'}
                      </Tag>
                      {role !== '-' ? (
                        <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                          {role}
                        </Tag>
                      ) : null}
                    </div>

                    <Descriptions
                      size="small"
                      column={{ xs: 1, sm: 2 }}
                      colon={false}
                      items={[
                        {
                          key: 'email',
                          label: 'E-mail',
                          children:
                            user?.email
                              ? <Text copyable={{ text: user.email }}>{user.email}</Text>
                              : email,
                        },
                        {
                          key: 'username',
                          label: 'Usuário',
                          children:
                            user?.username
                              ? <Text copyable={{ text: user.username }}>{user.username}</Text>
                              : username,
                        },
                        {
                          key: 'phone',
                          label: 'Telefone',
                          children: phone,
                        },
                        {
                          key: 'id',
                          label: 'ID',
                          children: user?.id ?? '-',
                        },
                      ]}
                    />
                  </Space>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>Preferências rápidas</Text>
              <Text type="secondary">
                Breadcrumbs: {preferences.showBreadcrumbs ? 'ativados' : 'desativados'} · Busca global:{' '}
                {preferences.showGlobalSearch ? 'ativada' : 'desativada'}
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            className="atlas-services-filter-card"
            title="Sessão"
            bordered={false}
            styles={{ body: { padding: 16 } }}
          >
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Text type="secondary">Encerrar sua sessão neste navegador.</Text>
              <Button danger icon={<LogoutOutlined />} loading={loggingOut} onClick={() => void onLogout()}>
                Sair deste navegador
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
