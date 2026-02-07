import React from 'react';
import { Card, Typography, Space, Tooltip } from 'antd';
import type { CustoIndireto } from './CustosIndiretosTable';
import {useLayout} from "../../../shared/components/layout/LayoutContext.tsx";

const { Title, Text } = Typography;

interface CustosIndiretosChartProps {
  data: CustoIndireto[];
  loading?: boolean;
}

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

export const CustosIndiretosChart: React.FC<CustosIndiretosChartProps> = ({ data, loading }) => {
  const {isDarkMode} = useLayout();
  const getCategoriaColor = (categoria: string) => {
    const categories: Record<string, string> = {
      'Administrativo': '#1890ff',
      'Infraestrutura': '#722ed1',
      'Pessoal': '#52c41a',
      'Marketing': '#eb2f96',
      'Outros': '#d9d9d9',
    };
    return categories[categoria] || '#1890ff';
  };

  // Agrupar por categoria
  const groupedData = data.reduce((acc: Record<string, number>, item) => {
    const categoria = item.categoria || 'Outros';
    acc[categoria] = (acc[categoria] || 0) + item.valor;
    return acc;
  }, {});

  const chartData: ChartDataItem[] = Object.entries(groupedData).map(([label, value]) => ({
    label,
    value,
    color: getCategoriaColor(label),
  })).sort((a, b) => b.value - a.value);

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card 
      variant="borderless" 
      loading={loading}
      style={{ 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '24px',
        height: '350px',
        background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ?  'none' : '1px solid #5757571A'
      }}
      styles={{ body: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>Distribuição por Categoria</Title>
        <Text type="secondary">Custos indiretos acumulados por categoria</Text>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'space-around',
        paddingTop: '20px',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '8px',
        overflowX: 'auto'
      }}>
        {chartData.length > 0 ? chartData.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            width: `${100 / chartData.length}%`,
            height: '100%',
            justifyContent: 'flex-end',
            minWidth: '60px',
            maxWidth: '120px'
          }}>
            <Tooltip title={`${item.label}: ${formatCurrency(item.value)}`}>
              <div style={{ 
                width: '60%', 
                height: `${(item.value / maxValue) * 100}%`, 
                backgroundColor: item.color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease, background-color 0.3s',
                cursor: 'pointer',
                minHeight: '2px'
              }} 
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${item.color}cc`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = item.color)}
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
                width: '100%'
              }}
            >
              {item.label}
            </Text>
          </div>
        )) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text type="secondary">Nenhum dado disponível</Text>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {chartData.map((item, index) => (
          <Space key={index} size={4}>
            <div style={{ width: '8px', height: '8px', backgroundColor: item.color, borderRadius: '50%' }} />
            <Text style={{ fontSize: '10px' }}>{item.label}</Text>
          </Space>
        ))}
      </div>
    </Card>
  );
};
