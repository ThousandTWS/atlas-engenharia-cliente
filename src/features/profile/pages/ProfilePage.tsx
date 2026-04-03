import React from 'react';
import { Avatar, Card, Col, Divider, Row, Typography, App } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { authService } from '../../../core/services/authService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode, isMobile } = useLayout();
  const [user, setUser] = React.useState(authService.getCurrentUser());

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

  const palette = isDarkMode
    ? {
        border: '#27324A',
        surface: '#0B111D',
        hero: 'linear-gradient(130deg, #0B1324 0%, #0A1020 48%, #172139 100%)',
        mutedText: '#94A3B8',
        strongText: '#E2E8F0',
      }
    : {
        border: '#DCE3EE',
        surface: '#FFFFFF',
        hero: 'linear-gradient(130deg, #F8FAFF 0%, #EEF3FB 48%, #E5ECF8 100%)',
        mutedText: '#64748B',
        strongText: '#1E293B',
      };

  const primaryCardStyle = {
    borderRadius: 8,
    borderColor: palette.border,
    background: palette.surface,
    boxShadow: isDarkMode ? '0 12px 30px #00000040' : '0 10px 28px #0f172a14',
  };

  void message;

  return (
    <div style={{ padding: isMobile ? 12 : 20 }}>
      <Card style={{ ...primaryCardStyle }} styles={{ body: { padding: isMobile ? 16 : 20 } }}>
        <div
          style={{
            padding: isMobile ? '18px 16px' : '22px 24px',
            borderRadius: 8,
            background: palette.hero,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col flex="none">
              <Avatar
                size={isMobile ? 72 : 84}
                icon={<UserOutlined />}
                src={user?.profilePictureUrl ?? undefined}
                style={{
                  backgroundColor: isDarkMode ? '#1E2A47' : '#E2E8F0',
                  border: `3px solid ${isDarkMode ? '#1E2A47' : '#FFFFFF'}`,
                }}
              />
            </Col>
            <Col flex="auto">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Title level={4} style={{ margin: 0, color: palette.strongText }}>
                  {user?.nomeCompleto || 'Usuário'}
                </Title>
                <Text style={{ color: palette.mutedText }}>{user?.email || '-'}</Text>
                <Text style={{ color: palette.mutedText }}>
                  {user?.username ? `Usuário: ${user.username}` : 'Usuário: -'}
                </Text>
                <Text style={{ color: palette.mutedText }}>
                  {user?.telefone ? `Telefone: ${user.telefone}` : 'Telefone: -'}
                </Text>
              </div>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '18px 0', borderColor: palette.border }} />

        <Row gutter={[16, 12]}>
          <Col span={24}>
            <Text style={{ color: palette.mutedText }}>Cargo</Text>
            <div>
              <Text style={{ color: palette.strongText, fontWeight: 500 }}>{user?.role || '-'}</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
