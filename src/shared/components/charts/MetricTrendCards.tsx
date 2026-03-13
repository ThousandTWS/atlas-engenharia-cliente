import React, { useMemo } from 'react';
import { Card, Col, DatePicker, Row, Segmented, Select, Space, Tag, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLayout } from '../layout/LayoutContext';
import type { Dayjs } from 'dayjs';
import type {
  MetricGroupingOption,
  MetricPeriodOption,
  MetricSeriesPoint,
} from '../../utils/metricSeries';

const { Text, Title } = Typography;

export interface MetricTrendCardDefinition {
  id: string;
  title: string;
  subtitle: string;
  valueType: 'currency' | 'number';
  series: MetricSeriesPoint[];
  color: string;
  icon: React.ReactNode;
  inverseTrend?: boolean;
  totalLabel?: string;
  filters?: {
    period: MetricPeriodOption;
    grouping: MetricGroupingOption;
    customRange?: [Dayjs | null, Dayjs | null] | null;
    onPeriodChange: (value: MetricPeriodOption) => void;
    onGroupingChange: (value: MetricGroupingOption) => void;
    onCustomRangeChange: (value: [Dayjs | null, Dayjs | null] | null) => void;
  };
}

interface MetricTrendCardsProps {
  cards: MetricTrendCardDefinition[];
  loading?: boolean;
}

const formatMetric = (value: number, type: 'currency' | 'number') => {
  if (type === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
};

const periodOptions = [
  { label: '1 mês', value: '1m' },
  { label: '3 meses', value: '3m' },
  { label: '6 meses', value: '6m' },
  { label: '12 meses', value: '12m' },
  { label: 'Personalizado', value: 'custom' },
] satisfies { label: string; value: MetricPeriodOption }[];

const groupingOptions = [
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
] satisfies { label: string; value: MetricGroupingOption }[];

const MetricTrendCard: React.FC<{ definition: MetricTrendCardDefinition; loading: boolean }> = ({ definition, loading }) => {
  const { isDarkMode } = useLayout();

  const total = useMemo(() => definition.series.reduce((sum, point) => sum + point.value, 0), [definition.series]);
  const currentValue = definition.series[definition.series.length - 1]?.value ?? 0;
  const previousValue = definition.series[definition.series.length - 2]?.value ?? 0;

  const trend = previousValue === 0
    ? currentValue > 0
      ? 100
      : 0
    : ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

  const favorableTrend = definition.inverseTrend ? trend <= 0 : trend >= 0;
  const trendIsUp = trend >= 0;
  const trendBadgeClass = favorableTrend ? 'atlas-status-badge-success' : 'atlas-status-badge-danger';

  return (
    <Card
      className="atlas-metric-trend-card"
      loading={loading}
      variant="borderless"
      style={{
        height: '100%',
        borderRadius: 16,
        border: isDarkMode ? '1px solid #253353' : '1px solid #e2e8f0',
        boxShadow: isDarkMode ? '0 12px 26px #00000028' : '0 10px 24px #0f172a12',
        background: isDarkMode
          ? 'linear-gradient(155deg, #121d33 0%, #0b1428 100%)'
          : 'linear-gradient(155deg, #ffffff 0%, #f8fbff 100%)',
      }}
      styles={{ body: { padding: 18 } }}
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space orientation="vertical" size={2}>
            <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }}>{definition.subtitle}</Text>
            <Title level={4} style={{ margin: 0 }}>{definition.title}</Title>
          </Space>

          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              color: definition.color,
              background: `${definition.color}1A`,
              border: `1px solid ${definition.color}33`,
            }}
          >
            {definition.icon}
          </div>
        </div>

        {definition.filters ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Segmented
              className="atlas-segmented-control"
              block
              options={periodOptions}
              value={definition.filters.period}
              onChange={(value) => definition.filters?.onPeriodChange(value as MetricPeriodOption)}
            />

            <Space wrap size={8} style={{ width: '100%' }}>
              <Select
                className="atlas-dashboard-filter-select"
                value={definition.filters.grouping}
                options={groupingOptions}
                onChange={(value) => definition.filters?.onGroupingChange(value)}
                style={{ minWidth: 160, flex: 1 }}
              />

              {definition.filters.period === 'custom' ? (
                <DatePicker.RangePicker
                  className="atlas-dashboard-filter-range"
                  value={definition.filters.customRange?.[0] && definition.filters.customRange?.[1]
                    ? [definition.filters.customRange[0], definition.filters.customRange[1]]
                    : null}
                  format="DD/MM/YYYY"
                  onChange={(value) => definition.filters?.onCustomRangeChange(value ? [value[0], value[1]] : null)}
                  style={{ flex: 1, minWidth: 220 }}
                />
              ) : null}
            </Space>
          </Space>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{definition.totalLabel ?? 'Acumulado 6 meses'}</Text>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
              {formatMetric(total, definition.valueType)}
            </Title>
          </div>
          <Tag
            variant="filled"
            className={`atlas-status-badge ${trendBadgeClass}`}
          >
            <span className="atlas-status-badge-dot" />
            {trendIsUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend).toFixed(1)}%
          </Tag>
        </div>

        <div style={{ height: 150, marginTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={definition.series} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`${definition.id}-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={definition.color} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={definition.color} stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? '#22324d' : '#e2e8f0'} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: isDarkMode ? '#AFC0DA' : '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: isDarkMode ? '#AFC0DA' : '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatMetric(Number(value), definition.valueType)}
              />
              <RechartsTooltip
                formatter={(value: number) => formatMetric(Number(value), definition.valueType)}
                labelFormatter={(label) => label}
                contentStyle={{
                  background: isDarkMode ? '#0F172A' : '#FFFFFF',
                  border: isDarkMode ? '1px solid #253353' : '1px solid #e2e8f0',
                  borderRadius: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={definition.color}
                strokeWidth={2.4}
                fill={`url(#${definition.id}-gradient)`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Space>
    </Card>
  );
};

export const MetricTrendCards: React.FC<MetricTrendCardsProps> = ({ cards, loading = false }) => {
  if (!cards.length) {
    return null;
  }

  const xlSpan = cards.length === 1 ? 24 : (cards.length === 2 ? 12 : 8);

  return (
    <Row gutter={[20, 20]}>
      {cards.map((card) => (
        <Col key={card.id} xs={24} md={12} xl={xlSpan}>
          <MetricTrendCard definition={card} loading={loading} />
        </Col>
      ))}
    </Row>
  );
};
