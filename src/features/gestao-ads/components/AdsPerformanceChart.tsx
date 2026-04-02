import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Segmented, Select, Space, Tag, Typography } from 'antd';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { MetricKey, PerformancePoint } from '../services/adsDataService';
import {
  computeTotals,
  fetchPerformanceTimeseries,
  formatMetricValue,
  getMetricLabel,
} from '../services/adsDataService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

const metricOptions: { label: string; value: MetricKey }[] = [
  { label: 'Cliques', value: 'cliques' },
  { label: 'Impressões', value: 'impressoes' },
  { label: 'Custo', value: 'custo' },
  { label: 'Conversões', value: 'conversoes' },
];

const palette = {
  primary: '#4285F4',
  secondary: '#34A853',
  accent: '#FBBC05',
  warning: '#EA4335',
};

export const AdsPerformanceChart: React.FC = () => {
  const { isDarkMode } = useLayout();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [primaryMetric, setPrimaryMetric] = useState<MetricKey>('cliques');
  const [secondaryMetric, setSecondaryMetric] = useState<MetricKey>('conversoes');
  const [data, setData] = useState<PerformancePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const response = await fetchPerformanceTimeseries(period);
      setData(response);
      setLoading(false);
    };

    loadData();
  }, [period]);

  const totals = useMemo(() => computeTotals(data), [data]);

  const renderTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;

    const first = payload[0];
    const second = payload[1];

    return (
      <div
        style={{
          background: isDarkMode ? '#0A0F1C' : '#fff',
          border: '1px solid #E5E7EB',
          padding: 12,
          borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        }}
      >
        <Text strong>{label}</Text>
        <div style={{ marginTop: 8 }}>
          {first && (
            <div style={{ color: first.color, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>{getMetricLabel(first.dataKey as MetricKey)}</span>
              <span>{formatMetricValue(first.dataKey as MetricKey, Number(first.value))}</span>
            </div>
          )}
          {second && (
            <div style={{ color: second.color, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>{getMetricLabel(second.dataKey as MetricKey)}</span>
              <span>{formatMetricValue(second.dataKey as MetricKey, Number(second.value))}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      loading={loading}
      title={
        <Space orientation="vertical" size={2}>
          <Text style={{ color: isDarkMode ? '#94A3B8' : '#4B5563', fontSize: 12, letterSpacing: 0.4 }}>Dashboard de Tráfego Pago</Text>
          <Title level={4} style={{ margin: 0 }}>Performance Multimétrica</Title>
        </Space>
      }
      extra={
        <Segmented
          className="prevent-segmented-control"
          value={period}
          options={[
            { label: '7 dias', value: '7d' },
            { label: '30 dias', value: '30d' },
            { label: '90 dias', value: '90d' },
          ]}
          onChange={(value) => setPeriod(value as '7d' | '30d' | '90d')}
        />
      }
      style={{
        borderRadius: 16,
        boxShadow: isDarkMode ? '0 14px 32px #00000030' : '0 14px 32px #0F172A14',
        background: isDarkMode ? 'linear-gradient(145deg, #0A0F1C 0%, #141B2D 100%)' : '#fff',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12}>
          <Space wrap>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Métrica primária</Text>
              <Select
                size="small"
                value={primaryMetric}
                options={metricOptions}
                onChange={(value) => setPrimaryMetric(value)}
                style={{ minWidth: 160 }}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Métrica secundária</Text>
              <Select
                size="small"
                value={secondaryMetric}
                options={metricOptions}
                onChange={(value) => setSecondaryMetric(value)}
                style={{ minWidth: 180 }}
              />
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={12}>
          <Space size={12} wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Tag className="prevent-status-badge prevent-status-badge-primary" variant="filled">
              <span className="prevent-status-badge-dot" />
              {getMetricLabel(primaryMetric)}
            </Tag>
            <Tag className="prevent-status-badge prevent-status-badge-secondary" variant="filled">
              <span className="prevent-status-badge-dot" />
              {getMetricLabel(secondaryMetric)}
            </Tag>
          </Space>
        </Col>
      </Row>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.primary} stopOpacity={0.4} />
                <stop offset="95%" stopColor={palette.primary} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.secondary} stopOpacity={0.35} />
                <stop offset="95%" stopColor={palette.secondary} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? '#1f2937' : '#E5E7EB'} />
            <XAxis dataKey="data" tick={{ fontSize: 12, fill: isDarkMode ? '#CBD5E1' : '#475569' }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#475569' }}
              tickFormatter={(value) => formatMetricValue(primaryMetric, value as number)}
            />
            <YAxis
              orientation="right"
              yAxisId="right"
              tick={{ fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#475569' }}
              tickFormatter={(value) => formatMetricValue(secondaryMetric, value as number)}
            />
            <Tooltip content={renderTooltip} />
            <Area
              type="monotone"
              dataKey={primaryMetric}
              stroke={palette.primary}
              fill="url(#primaryGradient)"
              strokeWidth={2.4}
              yAxisId="left"
            />
            <Area
              type="monotone"
              dataKey={secondaryMetric}
              stroke={palette.secondary}
              fill="url(#secondaryGradient)"
              strokeWidth={2.4}
              yAxisId="right"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        {[['cliques', totals.cliques], ['impressoes', totals.impressoes], ['custo', totals.custo], ['conversoes', totals.conversoes]].map(([metric, value]) => (
          <Col key={metric as string} xs={12} sm={6}>
            <Card
              size="small"
              variant="borderless"
              style={{
                background: isDarkMode ? '#0F172A' : '#F8FAFC',
                borderRadius: 12,
                boxShadow: isDarkMode ? '0 6px 14px #00000020' : '0 6px 12px #0F172A0d',
              }}
              styles={{ body: { padding: 12 } }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>{getMetricLabel(metric as MetricKey)}</Text>
              <Title level={4} style={{ margin: '4px 0 0' }}>
                {formatMetricValue(metric as MetricKey, value as number)}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
