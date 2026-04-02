import React from 'react';
import { Avatar, Breadcrumb, Button, Card, Col, Divider, Row, Typography, Upload, App } from 'antd';
import { HomeOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { authService } from '../../../core/services/authService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode, isMobile } = useLayout();
  const [isLoading, setIsLoading] = React.useState(false);
  const [user, setUser] = React.useState(authService.getCurrentUser());
  const workshop = authService.getCurrentWorkshop();

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

  const uploadProps: UploadProps = {
    showUploadList: false,
    accept: 'image/*',
    beforeUpload: () => false,
    customRequest: async (options) => {
      try {
        setIsLoading(true);
        const file = options.file as File;
        const response = await authService.updateProfilePhoto(file);
        setUser(response.user);
        message.success('Foto de perfil atualizada com sucesso!');
        options.onSuccess?.(response, new XMLHttpRequest());
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da foto.';
        message.error(errorMessage);
        options.onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
  };

  return (
    <div style={{ padding: isMobile ? 12 : 20 }}>
      <Breadcrumb
        style={{ marginBottom: 16, color: palette.mutedText }}
        items={[
          {
            href: '/',
            title: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HomeOutlined /> Home
              </span>
            ),
          },
          { title: 'Perfil' },
        ]}
      />

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
                src={user?.profilePhotoUrl ?? undefined}
                style={{
                  backgroundColor: isDarkMode ? '#1E2A47' : '#E2E8F0',
                  border: `3px solid ${isDarkMode ? '#1E2A47' : '#FFFFFF'}`,
                }}
              />
            </Col>
            <Col flex="auto">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Title level={4} style={{ margin: 0, color: palette.strongText }}>
                  {user?.fullName || 'Usuário'}
                </Title>
                <Text style={{ color: palette.mutedText }}>{user?.email || '-'}</Text>
                <Text style={{ color: palette.mutedText }}>
                  {workshop ? `Oficina: ${workshop.name} (${workshop.slug})` : 'Oficina: -'}
                </Text>
              </div>
            </Col>
            <Col flex="none">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} loading={isLoading} style={{ borderRadius: 8 }}>
                  Alterar foto
                </Button>
              </Upload>
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

