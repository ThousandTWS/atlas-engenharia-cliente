import React, { useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import {
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { homeDashboardFacade } from '../services/homeDashboardFacade';
import { CollectionComposite, CollectionLeaf } from '../../../core/structural/composite/collectionComposite';
import { MetricTrendCards, type MetricTrendCardDefinition } from '../../../shared/components/charts/MetricTrendCards';
import { buildEmptySeries, buildMonthlySeries, pickNumericValue, toSeriesRecords, type MetricSeriesPoint, type MetricSeriesRecord } from '../../../shared/utils/metricSeries';

interface DashboardSeries {
  entradas: MetricSeriesPoint[];
  faturamento: MetricSeriesPoint[];
  custos: MetricSeriesPoint[];
}

export const DashboardAreaCards: React.FC = () => {
  const { message } = App.useApp();
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
        const snapshot = await homeDashboardFacade.getSnapshot(0, 500);

        const projectsComposite = new CollectionComposite<MetricSeriesRecord>();
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.avcbs)));
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.clcbs)));
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.obras)));
        projectsComposite.add(new CollectionLeaf(toSeriesRecords(snapshot.processos)));

        const allContracts = projectsComposite.toArray();
        const lancamentoRecords = toSeriesRecords(snapshot.lancamentos);
        const custoRecords = toSeriesRecords(snapshot.custos);

        setSeries({
          entradas: buildMonthlySeries(allContracts, ['dataContrato', 'data'], () => 1),
          faturamento: buildMonthlySeries(lancamentoRecords, ['data', 'dataContrato'], (record) =>
            pickNumericValue(record, ['faturamento', 'valorContrato', 'valor']),
          ),
          custos: buildMonthlySeries(custoRecords, ['data', 'dataContrato'], (record) =>
            pickNumericValue(record, ['valor', 'custos']),
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

  const cards = useMemo<MetricTrendCardDefinition[]>(() => ([
    {
      id: 'dashboard-entradas',
      title: 'Entradas de Processos',
      subtitle: 'Novos processos por mês',
      valueType: 'number',
      series: series.entradas,
      color: '#3B82F6',
      icon: <FileTextOutlined />,
    },
    {
      id: 'dashboard-faturamento',
      title: 'Faturamento',
      subtitle: 'Receita mensal consolidada',
      valueType: 'currency',
      series: series.faturamento,
      color: '#10B981',
      icon: <DollarCircleOutlined />,
    },
    {
      id: 'dashboard-custos',
      title: 'Custos Indiretos',
      subtitle: 'Saídas mensais consolidadas',
      valueType: 'currency',
      series: series.custos,
      color: '#F59E0B',
      icon: <WalletOutlined />,
      inverseTrend: true,
    },
  ]), [series]);

  return <MetricTrendCards cards={cards} loading={loading} />;
};
