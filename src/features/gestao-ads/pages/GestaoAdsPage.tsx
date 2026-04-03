import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Typography,
} from 'antd';
import {
  GoogleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { AdsPerformanceChart } from '../components/AdsPerformanceChart';
import { CampaignPerformanceTable } from '../components/CampaignPerformanceTable';
import { adsDashboardFacade } from '../services/adsDashboardFacade';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { formatCurrencyPtBr } from '../../../core/structural/flyweight/numberFormatterFlyweight';

const { Title, Text } = Typography;

export const GestaoAdsPage: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode, isMobile } = useLayout();
  const [refreshToken, setRefreshToken] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [averageRoas, setAverageRoas] = useState(0);
  const [totals, setTotals] = useState({ cliques: 0, impressoes: 0, custo: 0, conversoes: 0 });

  const summaryCardStyle = {
    borderRadius: 8,
    background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
    border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1',
  };

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const summary = await adsDashboardFacade.getSummary('30d');
      setTotals(summary.totals);
      setCampaignsCount(summary.campaignsCount);
      setActiveCampaigns(summary.activeCampaigns);
      setAverageRoas(summary.averageRoas);
    } catch (error) {
      console.error('Erro ao carregar resumo de ads', error);
      message.error('Não foi possível carregar os indicadores de Ads.');
    } finally {
      setLoadingSummary(false);
    }
  }, [message]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshToken]);

  const conversionRate = useMemo(() => {
    if (totals.cliques <= 0) return 0;
    return (totals.conversoes / totals.cliques) * 100;
  }, [totals.cliques, totals.conversoes]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <Space orientation="vertical" size={0}>
          <Space align="center" size={8}>
            <GoogleOutlined style={{ color: '#4285F4' }} />
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              Gestão Ads
            </Title>
          </Space>
          <Text type="secondary">Monitoramento de campanhas, custo, conversões e recomendações automáticas.</Text>
        </Space>
        <Button
          className="ads-refresh-button"
          type="primary"
          size="large"
          icon={<ReloadOutlined />}
          onClick={() => {
            adsDashboardFacade.clearCache();
            setRefreshToken((prev) => prev + 1);
          }}
          loading={loadingSummary}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Atualizar Dados
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={summaryCardStyle} loading={loadingSummary}>
            <Statistic title="Campanhas" value={campaignsCount} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={summaryCardStyle} loading={loadingSummary}>
            <Statistic title="Campanhas Ativas" value={activeCampaigns} prefix={<AimOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={summaryCardStyle} loading={loadingSummary}>
            <Statistic
              title="Custo (30 dias)"
              value={totals.custo}
              prefix={<WalletOutlined />}
              formatter={(value) => formatCurrencyPtBr(Number(value), 0)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={summaryCardStyle} loading={loadingSummary}>
            <Statistic
              title="ROAS / Conv. média"
              value={`${averageRoas.toFixed(2)}x • ${conversionRate.toFixed(2)}%`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <AdsPerformanceChart key={`ads-chart-${refreshToken}`} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col span={24}>
          <CampaignPerformanceTable key={`ads-table-${refreshToken}`} />
        </Col>
      </Row>
    </div>
  );
};
