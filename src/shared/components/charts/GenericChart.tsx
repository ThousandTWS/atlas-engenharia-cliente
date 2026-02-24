import React from 'react';
import { Card, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { useLayout } from '../layout/LayoutContext.tsx';

const { Title, Text } = Typography;

interface GenericChartProps {
  title: string;
  subtitle?: string;
  data: { label: string; value: number; color?: string }[];
  loading?: boolean;
  height?: number;
  valuePrefix?: string;
  type?: 'bar' | 'pie';
  color?: string;
}

export const GenericChart: React.FC<GenericChartProps> = ({
  title,
  subtitle,
  data,
  loading,
  height = 350,
  valuePrefix = '',
  type = 'bar',
  color,
}) => {
  const { isDarkMode } = useLayout();
  const defaultColors = [
    '#1890ff',
    '#722ed1',
    '#52c41a',
    '#eb2f96',
    '#faad14',
    '#f5222d',
    '#13c2c2',
    '#2f54eb',
    '#fa8c16',
    '#8B4513',
    '#8B5E47',
  ];

  const formatValue = (value: number) => {
    if (valuePrefix === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  };

  const renderContent = () => {
    if (!data.length) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text type="secondary">Nenhum dado disponível</Text>
        </div>
      );
    }

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <RTooltip formatter={(v: number) => formatValue(Number(v))} />
            <Legend />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              label={({ name }) => name}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={entry.color || color || defaultColors[index % defaultColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#E5E7EB'} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatValue(Number(v))} />
          <RTooltip formatter={(v: number) => formatValue(Number(v))} />
          <Legend />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            fill={color || defaultColors[0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={entry.color || color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card
      variant="borderless"
      loading={loading}
      style={{
        borderRadius: 12,
        boxShadow: isDarkMode ? '0 10px 24px #0000001A' : '0 5px 10px #2E2E2E33',
        marginBottom: 24,
        height,
        background: isDarkMode
          ? 'linear-gradient(135deg, #2A3A5C 0%, #1E2A47 50%, #141B2D 100%)'
          : '#FFF',
      }}
      styles={{ body: { padding: 24, height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </div>

      <div style={{ flex: 1, minHeight: 200 }}>{renderContent()}</div>
    </Card>
  );
};
