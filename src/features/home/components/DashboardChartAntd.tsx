import React, { useEffect, useState } from 'react';
import { Row, Col, App } from 'antd';
import { avcbService, clcbService, processosAdmService, custosIndiretosService } from '../../../core/services/genericService';
import { obrasService } from '../../../core/services/obrasService';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import dayjs from 'dayjs';

export const DashboardChartAntd: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [custosData, setCustosData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [avcbs, clcbs, obras, processos, custos] = await Promise.all([
          avcbService.getAll(),
          clcbService.getAll(),
          obrasService.getAll(),
          processosAdmService.getAll(),
          custosIndiretosService.getAll(),
        ]);

        const allProjects: any[] = [
          ...(Array.isArray(avcbs) ? avcbs : (avcbs as any).content || []),
          ...(Array.isArray(clcbs) ? clcbs : (clcbs as any).content || []),
          ...(Array.isArray(obras) ? obras : (obras as any).content || []),
          ...(Array.isArray(processos) ? processos : (processos as any).content || []),
        ];

        const allCustos: any[] = Array.isArray(custos) ? custos : (custos as any).content || [];

        // Agrupar por mês nos últimos 6 meses
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          return dayjs().subtract(5 - i, 'month').format('MMM');
        });

        const performanceMap = last6Months.reduce((acc, month) => {
          acc[month] = { month, propostas: 0, aprovadas: 0 };
          return acc;
        }, {} as Record<string, any>);

        allProjects.forEach(item => {
          const date = item.dataContrato;
          if (!date) return;
          const month = dayjs(date).format('MMM');
          if (performanceMap[month]) {
            performanceMap[month].propostas++;
            const situacao = item.situacao || item.status;
            if (situacao === 'CONCLUIDO' || situacao === 'APROVADO' || situacao === 'Aprovado') {
              performanceMap[month].aprovadas++;
            }
          }
        });

        setData(last6Months.map(month => ({
          label: month,
          value: performanceMap[month].aprovadas,
          propostas: performanceMap[month].propostas
        })));

        // Agrupar custos por categoria para o segundo gráfico
        const categoryMap = allCustos.reduce((acc: Record<string, number>, curr) => {
          const cat = curr.categoria || 'Outros';
          acc[cat] = (acc[cat] || 0) + (curr.valor || 0);
          return acc;
        }, {});

        setCustosData(Object.entries(categoryMap).map(([label, value]) => ({
          label,
          value
        })).sort((a, b) => b.value - a.value).slice(0, 5));

      } catch (error: any) {
        message.error('Erro ao carregar dados do dashboard: ' + error.message);
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
          title="Obras Aprovadas"
          subtitle="Volume de projetos concluídos/aprovados por mês"
          loading={loading}
          data={data}
          color="#52c41a"
        />
      </Col>
      <Col xs={24} lg={12}>
        <GenericChart
          title="Distribuição de Custos"
          subtitle="Principais categorias de custos indiretos"
          loading={loading}
          data={custosData}
          valuePrefix="R$"
          color="#722ed1"
        />
      </Col>
    </Row>
  );
};
