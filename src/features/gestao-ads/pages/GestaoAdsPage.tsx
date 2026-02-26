import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
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
  HomeOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { AdsPerformanceChart } from '../components/AdsPerformanceChart';
import { CampaignPerformanceTable } from '../components/CampaignPerformanceTable';
import {
  computeTotals,
  enrichCampaignMetrics,
  fetchCampaignPerformance,
  fetchPerformanceTimeseries,
} from '../services/adsDataService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

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
      const [performance, campaigns] = await Promise.all([
        fetchPerformanceTimeseries('30d'),
        fetchCampaignPerformance(),
      ]);

      const aggregated = computeTotals(performance);
      const enrichedCampaigns = enrichCampaignMetrics(campaigns);
      const roasAverage = enrichedCampaigns.length > 0
        ? enrichedCampaigns.reduce((acc, item) => acc + item.roas, 0) / enrichedCampaigns.length
        : 0;

      setTotals(aggregated);
      setCampaignsCount(campaigns.length);
      setActiveCampaigns(campaigns.filter((campaign) => campaign.status === 'Ativa').length);
      setAverageRoas(roasAverage);
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
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestões' },
          { title: 'Gestão Ads' },
        ]}
        style={{ marginBottom: 16 }}
      />

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
          onClick={() => setRefreshToken((prev) => prev + 1)}
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
              formatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(Number(value))
              }
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
