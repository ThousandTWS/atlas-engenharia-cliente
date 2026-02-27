/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Row, Col, App } from 'antd';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import dayjs from 'dayjs';
import { isApprovedPhase } from '../utils/projectStatusStrategies';
import { homeDashboardFacade } from '../services/homeDashboardFacade';
import { CollectionComposite, CollectionLeaf } from '../../../core/structural/composite/collectionComposite';

export const DashboardChartAntd: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [custosData, setCustosData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const snapshot = await homeDashboardFacade.getSnapshot(0, 500);

        const projectsComposite = new CollectionComposite<any>();
        projectsComposite.add(new CollectionLeaf(snapshot.avcbs));
        projectsComposite.add(new CollectionLeaf(snapshot.clcbs));
        projectsComposite.add(new CollectionLeaf(snapshot.obras));
        projectsComposite.add(new CollectionLeaf(snapshot.processos));

        const allProjects: any[] = projectsComposite.toArray();
        const allCustos: any[] = snapshot.custos;

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
            if (isApprovedPhase(situacao)) {
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
          color="#F5E947"
        />
      </Col>
    </Row>
  );
};
