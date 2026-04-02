import React, { useEffect, useMemo, useState } from 'react';
import { App, Breadcrumb, Button, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { DollarOutlined, HomeOutlined, SolutionOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { cadastrosApi, type BudgetRecord, type ProviderRecord, type ServiceRegistrationRecord } from '../cadastrosApi';

const { Title, Text } = Typography;

export const CadastrosHubPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [services, setServices] = useState<ServiceRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [budgetsResponse, providersResponse, servicesResponse] = await Promise.all([
          cadastrosApi.getBudgets({ size: 200 }),
          cadastrosApi.getProviders({ size: 200 }),
          cadastrosApi.getServices({ size: 200 }),
        ]);
        setBudgets(budgetsResponse.content);
        setProviders(providersResponse.content);
        setServices(servicesResponse.content);
      } catch (error: any) {
        message.error(`Erro ao carregar resumo de cadastros: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const budgetTotal = useMemo(
    () => budgets.reduce((acc, item) => acc + Number(item.totalValue || 0), 0),
    [budgets],
  );

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Cadastros' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Space direction="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>Central de Cadastros</Title>
          <Text type="secondary">Orçamentos, serviços, clientes e prestadores em um padrão único.</Text>
        </Space>
        <Text type="secondary">Atualizado em {dayjs().format('DD/MM/YYYY')}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card className="prevent-services-filter-card" loading={loading}>
            <Statistic title="Orçamentos cadastrados" value={budgets.length} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="prevent-services-filter-card" loading={loading}>
            <Statistic title="Serviços registrados" value={services.length} prefix={<SolutionOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="prevent-services-filter-card" loading={loading}>
            <Statistic title="Prestadores cadastrados" value={providers.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} lg={8}>
          <Card className="prevent-services-table-card" style={{ height: '100%' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Space size={10}>
                <WalletOutlined />
                <Text strong>Cadastro de Orçamento</Text>
              </Space>
              <Text type="secondary">Registre propostas antes de virar serviço e vincule depois pelo código.</Text>
              <Text strong>Volume atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetTotal)}</Text>
              <Button type="primary" className="prevent-services-button prevent-services-button-primary" onClick={() => navigate('/cadastros/orcamentos')}>
                Abrir orçamentos
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="prevent-services-table-card" style={{ height: '100%' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Space size={10}>
                <SolutionOutlined />
                <Text strong>Serviço + Cliente</Text>
              </Space>
              <Text type="secondary">Tela única com dados do cliente, serviço, financeiro e prestadores.</Text>
              <Text strong>Sequência automática por tipo e validação de parcelas.</Text>
              <Button type="primary" className="prevent-services-button prevent-services-button-primary" onClick={() => navigate('/cadastros/servicos')}>
                Abrir cadastro único
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="prevent-services-table-card" style={{ height: '100%' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Space size={10}>
                <TeamOutlined />
                <Text strong>Prestadores</Text>
              </Space>
              <Text type="secondary">Base rápida de prestadores com dados de pagamento sem obrigatoriedade.</Text>
              <Text strong>Acesso direto também pelo cadastro de serviço.</Text>
              <Button type="primary" className="prevent-services-button prevent-services-button-primary" onClick={() => navigate('/cadastros/prestadores')}>
                Abrir prestadores
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
