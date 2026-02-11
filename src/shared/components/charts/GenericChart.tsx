import React from 'react';
import { Card, Typography, Space, Tooltip } from 'antd';
import {useLayout} from "../layout/LayoutContext.tsx";

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
  isDarkMode?: boolean;
}

export const GenericChart: React.FC<GenericChartProps> = ({
  title,
  subtitle,
  data,
  loading,
  height = 350,
  valuePrefix = '',
  color,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const {isDarkMode} = useLayout();
  const formatValue = (value: number) => {
    if (valuePrefix === 'R$') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toString();
  };

  const defaultColors = [
    '#1890ff', '#722ed1', '#52c41a', '#eb2f96', '#faad14', 
    '#f5222d', '#13c2c2', '#2f54eb', '#722ed1', '#fa8c16'
  ];


  return (
    <Card
      variant="borderless"
      loading={loading}
      style={{
        borderRadius: '12px',
        boxShadow: isDarkMode ?  '0 10px 24px #0000001A' : '0 5px 10px #2E2E2E33',
        marginBottom: '24px',
        height: height,
        background : isDarkMode ? '#0A0F1C' : '#FAFBFC',
      }}
      styles={{ body: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingTop: '20px',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '8px',
        overflowX: 'auto',
      }}>
        {data.length > 0 ? (
          data.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: `${100 / data.length}%`,
                height: '100%',
                justifyContent: 'flex-end',
                minWidth: '60px',
                maxWidth: '120px',
              }}
            >
              <Tooltip title={`${item.label}: ${formatValue(item.value)}`}>
                <div
                  style={{
                    width: '60%',
                    height: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || color || defaultColors[index % defaultColors.length],
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease, background-color 0.3s',
                    cursor: 'pointer',
                    minHeight: '2px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                />
              </Tooltip>
              <Text
                type="secondary"
                style={{
                  fontSize: '11px',
                  marginTop: '8px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {item.label}
              </Text>
            </div>
          ))
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text type="secondary">Nenhum dado disponível</Text>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {data.map((item, index) => (
          <Space key={index} size={4}>
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: item.color || color || defaultColors[index % defaultColors.length],
                borderRadius: '50%',
              }}
            />
            <Text style={{ fontSize: '10px' }}>{item.label}</Text>
          </Space>
        ))}
      </div>
    </Card>
  );
};
