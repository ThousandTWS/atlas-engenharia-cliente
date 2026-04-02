import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Col, DatePicker, Row, Select, Space, Tag, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  LineChartOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs, { type Dayjs } from 'dayjs';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { homeDashboardFacade } from '../services/homeDashboardFacade';
import { CollectionComposite, CollectionLeaf } from '../../../core/structural/composite/collectionComposite';
import {
  buildFilteredSeries,
  buildMonthlySeries,
  pickNumericValue,
  toSeriesRecords,
  type MetricGroupingOption,
  type MetricPeriodOption,
  type MetricSeriesPoint,
  type MetricSeriesRecord,
} from '../../../shared/utils/metricSeries';

const { Text, Title } = Typography;

interface DashboardSourceData {
  contratos: MetricSeriesRecord[];
  lancamentos: MetricSeriesRecord[];
  custos: MetricSeriesRecord[];
}

type ChartMetricKey = 'entradas' | 'faturamento' | 'custos';

interface ChartFilters {
  period: MetricPeriodOption;
  grouping: MetricGroupingOption;
  customRange: [Dayjs | null, Dayjs | null] | null;
}

const createDefaultCustomRange = (): [Dayjs, Dayjs] => [
  dayjs().subtract(29, 'day').startOf('day'),
  dayjs().endOf('day'),
];

const createDefaultFilters = (): Record<ChartMetricKey, ChartFilters> => ({
  entradas: { period: '6m', grouping: 'monthly', customRange: null },
  faturamento: { period: '6m', grouping: 'monthly', customRange: null },
  custos: { period: '6m', grouping: 'monthly', customRange: null },
});

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

const formatMetric = (value: number, type: 'currency' | 'number' | 'percent') => {
  if (type === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (type === 'percent') {
    return `${value.toFixed(0)}%`;
  }

  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
};

const getTooltipSeriesLabel = (type: 'currency' | 'number') => (type === 'currency' ? 'Total' : 'Quantidade');

const sumSeries = (series: MetricSeriesPoint[]) => series.reduce((total, point) => total + point.value, 0);

const getTrend = (series: MetricSeriesPoint[]) => {
  const current = series[series.length - 1]?.value ?? 0;
  const previous = series[series.length - 2]?.value ?? 0;

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
};

const buildBalanceSeries = (revenueSeries: MetricSeriesPoint[], costSeries: MetricSeriesPoint[]) =>
  revenueSeries.map((point, index) => ({
    label: point.label,
    value: Number((point.value - (costSeries[index]?.value ?? 0)).toFixed(2)),
  }));

const buildAverageSeries = (revenueSeries: MetricSeriesPoint[], entrySeries: MetricSeriesPoint[]) =>
  revenueSeries.map((point, index) => {
    const entries = entrySeries[index]?.value ?? 0;
    return {
      label: point.label,
      value: Number((entries > 0 ? point.value / entries : 0).toFixed(2)),
    };
  });

const buildMarginSeries = (revenueSeries: MetricSeriesPoint[], costSeries: MetricSeriesPoint[]) =>
  revenueSeries.map((point, index) => {
    const revenue = point.value;
    const cost = costSeries[index]?.value ?? 0;
    return {
      label: point.label,
      value: Number((revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0).toFixed(2)),
    };
  });

interface ChartBlockDefinition {
  key: ChartMetricKey;
  title: string;
  eyebrow: string;
  color: string;
  valueType: 'currency' | 'number';
  data: MetricSeriesPoint[];
}

export const DashboardAreaCards: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const [loading, setLoading] = useState(true);
  const [sourceData, setSourceData] = useState<DashboardSourceData>({
    contratos: [],
    lancamentos: [],
    custos: [],
  });
  const [filters, setFilters] = useState<Record<ChartMetricKey, ChartFilters>>(createDefaultFilters);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const snapshot = await homeDashboardFacade.getSnapshot(0, 500);

        const projectsComposite = new CollectionComposite<MetricSeriesRecord>();
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.avcbs)));
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.clcbs)));
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.obras)));
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.processos)));

        setSourceData({
          contratos: projectsComposite.toArray(),
          lancamentos: toSeriesRecords(snapshot.lancamentos),
          custos: toSeriesRecords(snapshot.custos),
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        message.error(`Erro ao carregar cards do dashboard: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [message]);

  const cardSeries = useMemo(() => {
    const entradas = buildMonthlySeries(sourceData.contratos, ['dataContrato', 'data'], () => 1, 6);
    const faturamento = buildMonthlySeries(
      sourceData.lancamentos,
      ['data', 'dataContrato'],
      (record) => pickNumericValue(record, ['faturamento', 'valorContrato', 'valor']),
      6,
    );
    const custos = buildMonthlySeries(
      sourceData.custos,
      ['data', 'dataContrato'],
      (record) => pickNumericValue(record, ['valor', 'custos']),
      6,
    );

    return {
      entradas,
      faturamento,
      custos,
      saldo: buildBalanceSeries(faturamento, custos),
      media: buildAverageSeries(faturamento, entradas),
      margem: buildMarginSeries(faturamento, custos),
    };
  }, [sourceData]);

  const chartSeries = useMemo(() => ({
    entradas: buildFilteredSeries(sourceData.contratos, ['dataContrato', 'data'], () => 1, filters.entradas),
    faturamento: buildFilteredSeries(
      sourceData.lancamentos,
      ['data', 'dataContrato'],
      (record) => pickNumericValue(record, ['faturamento', 'valorContrato', 'valor']),
      filters.faturamento,
    ),
    custos: buildFilteredSeries(
      sourceData.custos,
      ['data', 'dataContrato'],
      (record) => pickNumericValue(record, ['valor', 'custos']),
      filters.custos,
    ),
  }), [filters, sourceData]);

  const summaryCards = useMemo(() => ([
    {
      id: 'entradas',
      title: 'Entradas',
      value: sumSeries(cardSeries.entradas),
      secondary: `${cardSeries.entradas[cardSeries.entradas.length - 1]?.value ?? 0} no último período`,
      icon: <FileTextOutlined />,
      color: '#2563eb',
      series: cardSeries.entradas,
      type: 'number' as const,
      trend: getTrend(cardSeries.entradas),
    },
    {
      id: 'faturamento',
      title: 'Faturamento',
      value: sumSeries(cardSeries.faturamento),
      secondary: 'Receita consolidada',
      icon: <DollarCircleOutlined />,
      color: '#1d4ed8',
      series: cardSeries.faturamento,
      type: 'currency' as const,
      trend: getTrend(cardSeries.faturamento),
    },
    {
      id: 'custos',
      title: 'Custos',
      value: sumSeries(cardSeries.custos),
      secondary: 'Saídas indiretas',
      icon: <WalletOutlined />,
      color: '#f59e0b',
      series: cardSeries.custos,
      type: 'currency' as const,
      trend: getTrend(cardSeries.custos),
      inverseTrend: true,
    },
    {
      id: 'saldo',
      title: 'Saldo',
      value: sumSeries(cardSeries.saldo),
      secondary: 'Faturamento menos custos',
      icon: <LineChartOutlined />,
      color: '#0f766e',
      series: cardSeries.saldo,
      type: 'currency' as const,
      trend: getTrend(cardSeries.saldo),
    },
    {
      id: 'media',
      title: 'Ticket médio',
      value: sumSeries(cardSeries.media) / Math.max(cardSeries.media.length, 1),
      secondary: 'Valor por entrada',
      icon: <DollarCircleOutlined />,
      color: '#7c3aed',
      series: cardSeries.media,
      type: 'currency' as const,
      trend: getTrend(cardSeries.media),
    },
    {
      id: 'margem',
      title: 'Margem',
      value: cardSeries.margem[cardSeries.margem.length - 1]?.value ?? 0,
      secondary: 'Eficiência no período atual',
      icon: <LineChartOutlined />,
      color: '#16a34a',
      series: cardSeries.margem,
      type: 'percent' as const,
      trend: getTrend(cardSeries.margem),
    },
  ]), [cardSeries]);

  const chartBlocks = useMemo<ChartBlockDefinition[]>(() => ([
    {
      key: 'entradas',
      title: 'Entradas',
      eyebrow: 'Fluxo operacional',
      color: '#3b82f6',
      valueType: 'number',
      data: chartSeries.entradas,
    },
    {
      key: 'faturamento',
      title: 'Faturamento',
      eyebrow: 'Receita consolidada',
      color: '#2563eb',
      valueType: 'currency',
      data: chartSeries.faturamento,
    },
    {
      key: 'custos',
      title: 'Custos',
      eyebrow: 'Saídas indiretas',
      color: '#f59e0b',
      valueType: 'currency',
      data: chartSeries.custos,
    },
  ]), [chartSeries]);

  const updateChartFilters = (key: ChartMetricKey, nextState: Partial<ChartFilters>) => {
    setFilters((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...nextState,
      },
    }));
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <div className="prevent-overview-grid prevent-overview-grid-full">
        {summaryCards.map((card) => {
          const trendIsPositive = card.inverseTrend ? card.trend <= 0 : card.trend >= 0;

          return (
            <Card
              key={card.id}
              loading={loading}
              variant="borderless"
              className="prevent-overview-stat-card"
              styles={{ body: { padding: 'clamp(14px, 1.4vw, 18px)' } }}
            >
              <div className="prevent-overview-stat-top">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {card.title}
                </Text>
                <span
                  className="prevent-overview-stat-icon"
                  style={{ background: `${card.color}14`, color: card.color }}
                >
                  {card.icon}
                </span>
              </div>

              <Title level={3} style={{ margin: '6px 0 4px', fontSize: 'clamp(1.1rem, 1.6vw, 1.75rem)' }}>
                {formatMetric(card.value, card.type)}
              </Title>

              <div className="prevent-overview-stat-foot">
                <Tag
                  className={`prevent-status-badge ${trendIsPositive ? 'prevent-status-badge-success' : 'prevent-status-badge-danger'}`}
                  bordered={false}
                >
                  <span className="prevent-status-badge-dot" />
                  {card.trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(card.trend).toFixed(1)}%
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {card.secondary}
                </Text>
              </div>

              <div style={{ height: 'clamp(32px, 5vw, 44px)', marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`${card.id}-spark`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.color} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={card.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={card.color}
                      strokeWidth={2}
                      fill={`url(#${card.id}-spark)`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </div>

      <Row gutter={[18, 18]} align="stretch">
        {chartBlocks.map((block, index) => {
          const blockFilters = filters[block.key];
          const trend = getTrend(block.data);
          const trendPositive = block.key === 'custos' ? trend <= 0 : trend >= 0;
          const total = sumSeries(block.data);

          return (
            <Col
              key={block.key}
              xs={24}
              md={12}
              xl={index === chartBlocks.length - 1 ? 24 : 12}
              className="prevent-overview-column"
            >
              <Card
                loading={loading}
                variant="borderless"
                className="prevent-overview-activity-card prevent-chart-block-card"
                styles={{ body: { padding: 'clamp(16px, 1.6vw, 22px)' } }}
              >
                <div className="prevent-overview-activity-head">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{block.eyebrow}</Text>
                    <Title level={4} style={{ margin: '4px 0 2px', fontSize: 'clamp(1.05rem, 1.4vw, 1.35rem)' }}>
                      {block.title}
                    </Title>
                    <Text className="prevent-chart-block-total">
                      {formatMetric(total, block.valueType)}
                    </Text>
                  </div>

                  <Tag
                    className={`prevent-status-badge ${trendPositive ? 'prevent-status-badge-success' : 'prevent-status-badge-danger'}`}
                    bordered={false}
                  >
                    <span className="prevent-status-badge-dot" />
                    {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend).toFixed(1)}%
                  </Tag>
                </div>

                <div className="prevent-overview-activity-toolbar">
                  <Select
                    className="prevent-dashboard-filter-select prevent-dashboard-filter-select-period"
                    value={blockFilters.period}
                    options={periodOptions}
                    onChange={(value) => updateChartFilters(block.key, {
                      period: value,
                      customRange: value === 'custom'
                        ? (blockFilters.customRange ?? createDefaultCustomRange())
                        : blockFilters.customRange,
                    })}
                    style={{ minWidth: 160 }}
                  />

                  <Select
                    className="prevent-dashboard-filter-select"
                    value={blockFilters.grouping}
                    options={groupingOptions}
                    onChange={(value) => updateChartFilters(block.key, { grouping: value })}
                    style={{ minWidth: 150 }}
                  />

                  {blockFilters.period === 'custom' ? (
                    <DatePicker.RangePicker
                      className="prevent-dashboard-filter-range"
                      value={blockFilters.customRange?.[0] && blockFilters.customRange?.[1]
                        ? [blockFilters.customRange[0], blockFilters.customRange[1]]
                        : null}
                      format="DD/MM/YYYY"
                      onChange={(value) => updateChartFilters(block.key, {
                        customRange: value ? [value[0], value[1]] : null,
                      })}
                    />
                  ) : null}
                </div>

                <div className="prevent-overview-chart-area" style={{ marginTop: 18 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={block.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                      <CartesianGrid vertical={false} strokeDasharray="4 8" stroke={isDarkMode ? '#1f314d' : '#e2e8f0'} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDarkMode ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDarkMode ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => formatMetric(Number(value), block.valueType)}
                        width={56}
                      />
                      <Tooltip
                        cursor={{ fill: isDarkMode ? '#ffffff08' : '#0f172a06' }}
                        formatter={(value: number) => [
                          formatMetric(Number(value), block.valueType),
                          getTooltipSeriesLabel(block.valueType),
                        ]}
                        labelStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}
                        itemStyle={{ color: isDarkMode ? '#dbeafe' : '#334155' }}
                        contentStyle={{
                          borderRadius: 14,
                          border: isDarkMode ? '1px solid #28446d' : '1px solid #dbe7f6',
                          background: isDarkMode ? 'linear-gradient(180deg, #132742 0%, #0f1f36 100%)' : '#ffffff',
                          boxShadow: isDarkMode ? '0 20px 50px #02061755' : '0 20px 50px #0f172a12',
                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={28}>
                        {block.data.map((point, index) => (
                          <Cell
                            key={`${block.key}-${point.label}-${index}`}
                            fill={index === block.data.length - 1 ? block.color : `${block.color}78`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Space>
  );
};
