import React from 'react';
import { App, Button, Card, Col, Divider, Form, Row, Space, Switch, Typography } from 'antd';
import { ArrowLeftOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { useUiPreferences } from '../../../shared/components/layout/uiPreferences';
import { authService } from '../../../core/services/authService';

const { Title, Text } = Typography;

export const ProfileSettingsPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode, toggleTheme } = useLayout();
  const { preferences, updatePreferences } = useUiPreferences();

  const [saving, setSaving] = React.useState(false);

  const onLogout = async () => {
    setSaving(true);
    try {
      await authService.logout();
      navigate('/auth/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível sair.';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space direction="vertical" size={2}>
          <Space size={10} align="center">
            <SettingOutlined style={{ color: isDarkMode ? '#93c5fd' : '#1d4ed8' }} />
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              Configurações
            </Title>
          </Space>
          <Text type="secondary">
            Preferências de interface e sessão do seu usuário.
          </Text>
        </Space>

        <Button
          className="atlas-back-button"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/profile')}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Voltar
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="atlas-services-filter-card"
            title="Interface"
            bordered={false}
            styles={{ body: { padding: 16 } }}
          >
            <Form layout="vertical">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <Text strong>Tema escuro</Text>
                  <div><Text type="secondary">Altera a aparência do sistema.</Text></div>
                </div>
                <Switch checked={isDarkMode} onChange={toggleTheme} />
              </div>

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <Text strong>Breadcrumbs no topo</Text>
                  <div><Text type="secondary">Mostra o caminho (Início / …) no header.</Text></div>
                </div>
                <Switch
                  checked={preferences.showBreadcrumbs}
                  onChange={(checked) => updatePreferences({ showBreadcrumbs: checked })}
                />
              </div>

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <Text strong>Busca global no header</Text>
                  <div><Text type="secondary">Exibe o campo “Pesquisar…” no topo.</Text></div>
                </div>
                <Switch
                  checked={preferences.showGlobalSearch}
                  onChange={(checked) => updatePreferences({ showGlobalSearch: checked })}
                />
              </div>
            </Form>
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
              <Text type="secondary">
                Encerrar sessão neste navegador.
              </Text>

              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={() => void onLogout()}
                loading={saving}
                style={{ width: '100%' }}
              >
                Sair
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

