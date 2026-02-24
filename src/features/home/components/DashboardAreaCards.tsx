import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
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
import dayjs from 'dayjs';
import {
  avcbService,
  clcbService,
  custosIndiretosService,
  lancamentosService,
  processosAdmService,
} from '../../../core/services/genericService';
import { obrasService } from '../../../core/services/obrasService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Text, Title } = Typography;

type DataRecord = Record<string, unknown>;

interface PaginatedLike<T> {
  content?: T[];
}

interface AreaPoint {
  label: string;
  value: number;
}

interface CardDefinition {
  id: string;
  title: string;
  subtitle: string;
  valueType: 'currency' | 'number';
  series: AreaPoint[];
  color: string;
  icon: React.ReactNode;
  inverseTrend?: boolean;
}

interface DashboardSeries {
  entradas: AreaPoint[];
  faturamento: AreaPoint[];
  custos: AreaPoint[];
}

const buildMonthBuckets = (months: number) =>
  Array.from({ length: months }, (_, index) => dayjs().subtract(months - 1 - index, 'month').startOf('month'));

const parseNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.-]/g, '');
    const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const pickNumber = (item: DataRecord, keys: string[]): number => {
  for (const key of keys) {
    if (key in item) {
      return parseNumber(item[key]);
    }
  }

  return 0;
};

const pickDate = (item: DataRecord, keys: string[]): dayjs.Dayjs | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = dayjs(value);
      if (parsed.isValid()) {
        return parsed;
      }
    }
  }

  return null;
};

const toRecords = (response: unknown): DataRecord[] => {
  if (Array.isArray(response)) {
    return response.filter((item): item is DataRecord => typeof item === 'object' && item !== null);
  }

  if (response && typeof response === 'object' && 'content' in response) {
    const content = (response as PaginatedLike<unknown>).content;
    return Array.isArray(content)
      ? content.filter((item): item is DataRecord => typeof item === 'object' && item !== null)
      : [];
  }

  return [];
};

const buildEmptySeries = (): AreaPoint[] =>
  buildMonthBuckets(6).map((month) => ({ label: month.format('MM/YY'), value: 0 }));

const buildMonthlySeries = (
  items: DataRecord[],
  dateKeys: string[],
  valueGetter: (item: DataRecord) => number,
  months = 6,
): AreaPoint[] => {
  const monthBuckets = buildMonthBuckets(months);
  const aggregate = new Map(monthBuckets.map((month) => [month.format('YYYY-MM'), 0]));

  items.forEach((item) => {
    const date = pickDate(item, dateKeys);
    if (!date) {
      return;
    }

    const monthKey = date.startOf('month').format('YYYY-MM');
    if (!aggregate.has(monthKey)) {
      return;
    }

    aggregate.set(monthKey, (aggregate.get(monthKey) ?? 0) + valueGetter(item));
  });

  return monthBuckets.map((month) => ({
    label: month.format('MM/YY'),
    value: Number((aggregate.get(month.format('YYYY-MM')) ?? 0).toFixed(2)),
  }));
};

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

interface MetricCardProps {
  definition: CardDefinition;
  loading: boolean;
  isDarkMode: boolean;
}

const AreaMetricCard: React.FC<MetricCardProps> = ({ definition, loading, isDarkMode }) => {
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

  return (
    <Card
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
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space direction="vertical" size={2}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Acumulado 6 meses</Text>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
              {formatMetric(total, definition.valueType)}
            </Title>
          </div>
          <Tag
            color={favorableTrend ? 'success' : 'error'}
            style={{ borderRadius: 999, marginInlineEnd: 0 }}
          >
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
                labelFormatter={(label) => `Mês ${label}`}
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

export const DashboardAreaCards: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<DashboardSeries>({
    entradas: buildEmptySeries(),
    faturamento: buildEmptySeries(),
    custos: buildEmptySeries(),
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const [avcbs, clcbs, obras, processos, lancamentos, custos] = await Promise.all([
          avcbService.getAll({ page: 0, size: 500 }),
          clcbService.getAll({ page: 0, size: 500 }),
          obrasService.getAll({ page: 0, size: 500 }),
          processosAdmService.getAll({ page: 0, size: 500 }),
          lancamentosService.getAll({ page: 0, size: 500 }),
          custosIndiretosService.getAll({ page: 0, size: 500 }),
        ]);

        const allContracts = [...toRecords(avcbs), ...toRecords(clcbs), ...toRecords(obras), ...toRecords(processos)];
        const allLancamentos = toRecords(lancamentos);
        const allCustos = toRecords(custos);

        setSeries({
          entradas: buildMonthlySeries(allContracts, ['dataContrato', 'data'], () => 1),
          faturamento: buildMonthlySeries(allLancamentos, ['data', 'dataContrato'], (item) =>
            pickNumber(item, ['faturamento', 'valorContrato', 'valor']),
          ),
          custos: buildMonthlySeries(allCustos, ['data', 'dataContrato'], (item) =>
            pickNumber(item, ['valor', 'custos']),
          ),
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

  const cards: CardDefinition[] = [
    {
      id: 'entradas-card',
      title: 'Entradas de Processos',
      subtitle: 'Novos processos por mês',
      valueType: 'number',
      series: series.entradas,
      color: '#3B82F6',
      icon: <FileTextOutlined />,
    },
    {
      id: 'faturamento-card',
      title: 'Faturamento',
      subtitle: 'Receita mensal consolidada',
      valueType: 'currency',
      series: series.faturamento,
      color: '#10B981',
      icon: <DollarCircleOutlined />,
    },
    {
      id: 'custos-card',
      title: 'Custos Indiretos',
      subtitle: 'Saídas mensais consolidadas',
      valueType: 'currency',
      series: series.custos,
      color: '#F59E0B',
      icon: <WalletOutlined />,
      inverseTrend: true,
    },
  ];

  return (
    <Row gutter={[20, 20]}>
      {cards.map((card) => (
        <Col key={card.id} xs={24} md={12} xl={8}>
          <AreaMetricCard definition={card} loading={loading} isDarkMode={isDarkMode} />
        </Col>
      ))}
    </Row>
  );
};
