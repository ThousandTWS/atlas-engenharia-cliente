import React, { useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import {
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  avcbService,
  clcbService,
  custosIndiretosService,
  lancamentosService,
  processosAdmService,
} from '../../../core/services/genericService';
import { obrasService } from '../../../core/services/obrasService';
import { MetricTrendCards, type MetricTrendCardDefinition } from '../../../shared/components/charts/MetricTrendCards';
import { buildEmptySeries, buildMonthlySeries, pickNumericValue, toSeriesRecords, type MetricSeriesPoint, type MetricSeriesRecord } from '../../../shared/utils/metricSeries';

interface PaginatedLike<T> {
  content?: T[];
}

interface DashboardSeries {
  entradas: MetricSeriesPoint[];
  faturamento: MetricSeriesPoint[];
  custos: MetricSeriesPoint[];
}

const toRecords = (response: unknown): MetricSeriesRecord[] => {
  if (Array.isArray(response)) {
    return toSeriesRecords(response);
  }

  if (response && typeof response === 'object' && 'content' in response) {
    const content = (response as PaginatedLike<unknown>).content;
    return Array.isArray(content) ? toSeriesRecords(content) : [];
  }

  return [];
};

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
        const [avcbs, clcbs, obras, processos, lancamentos, custos] = await Promise.all([
          avcbService.getAll({ page: 0, size: 500 }),
          clcbService.getAll({ page: 0, size: 500 }),
          obrasService.getAll({ page: 0, size: 500 }),
          processosAdmService.getAll({ page: 0, size: 500 }),
          lancamentosService.getAll({ page: 0, size: 500 }),
          custosIndiretosService.getAll({ page: 0, size: 500 }),
        ]);

        const allContracts = [
          ...toRecords(avcbs),
          ...toRecords(clcbs),
          ...toRecords(obras),
          ...toRecords(processos),
        ];
        const lancamentoRecords = toRecords(lancamentos);
        const custoRecords = toRecords(custos);

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
