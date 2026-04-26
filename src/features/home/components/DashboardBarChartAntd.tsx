import React, { useEffect, useState } from 'react';
import { Row, Col, App } from 'antd';
import { lancamentosService } from '../../../core/services/generic/genericService';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import dayjs from 'dayjs';

export const DashboardBarChartAntd: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await lancamentosService.getAll();
        const lancamentos = Array.isArray(response) ? response : (response as any).content || [];

        // Agrupar faturamento por mês nos últimos 6 meses
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          return dayjs().subtract(5 - i, 'month').format('MMM');
        });

        const statsMap = last6Months.reduce((acc, month) => {
          acc[month] = { month, faturamento: 0, lucro: 0 };
          return acc;
        }, {} as Record<string, any>);

        lancamentos.forEach((item: any) => {
          const date = dayjs(item.data);
          const month = date.format('MMM');
          if (statsMap[month]) {
            statsMap[month].faturamento += (item.faturamento || 0);
            statsMap[month].lucro += (item.lucro || 0);
          }
        });

        setRevenueData(last6Months.map(month => ({
          label: month,
          value: statsMap[month].faturamento
        })));

        setProfitData(last6Months.map(month => ({
          label: month,
          value: statsMap[month].lucro,
          color: statsMap[month].lucro >= 0 ? '#52c41a' : '#ff4d4f'
        })));

      } catch (error: any) {
        message.error('Erro ao carregar faturamento: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [message]);

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <GenericChart
          title="Faturamento Mensal"
          subtitle="Evolução da receita bruta (últimos 6 meses)"
          loading={loading}
          data={revenueData}
          valuePrefix="R$"
          color="#1890ff"
        />
      </Col>
      <Col xs={24} lg={12}>
        <GenericChart
          title="Lucratividade"
          subtitle="Resultado líquido mensal (últimos 6 meses)"
          loading={loading}
          data={profitData}
          valuePrefix="R$"
        />
      </Col>
    </Row>
  );
};
