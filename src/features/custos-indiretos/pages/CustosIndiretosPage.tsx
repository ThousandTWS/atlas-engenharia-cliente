/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Typography,
  Space,
  Breadcrumb,
  App,
} from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CustosIndiretosTable } from '../components/CustosIndiretosTable';
import type { CustoIndireto } from '../components/CustosIndiretosTable';
import { CustosIndiretosFilters } from '../components/CustosIndiretosFilters';
import { MetricTrendCards, type MetricTrendCardDefinition } from '../../../shared/components/charts/MetricTrendCards';
import { useMetricCardFilters } from '../../../shared/hooks/useMetricCardFilters';
import { custosIndiretosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { buildFilteredSeries, pickNumericValue, toSeriesRecords } from '../../../shared/utils/metricSeries';

const { Title, Text } = Typography;

export const CustosIndiretosPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [custos, setCustos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const cardIds = useMemo(() => ([
    'custos-indiretos-entradas',
    'custos-indiretos-total',
    'custos-indiretos-admin',
  ] as const), []);

  const {
    filters: chartFilters,
    setPeriod,
    setGrouping,
    setCustomRange,
  } = useMetricCardFilters(cardIds);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(custos);

    return [
      {
        id: 'custos-indiretos-entradas',
        title: 'Entradas de Custos',
        subtitle: 'Lançamentos mensais registrados',
        valueType: 'number',
        series: buildFilteredSeries(records, ['data', 'dataContrato'], () => 1, chartFilters['custos-indiretos-entradas']),
        color: '#3B82F6',
        icon: <FileTextOutlined />,
        filters: {
          ...chartFilters['custos-indiretos-entradas'],
          onPeriodChange: (value) => setPeriod('custos-indiretos-entradas', value),
          onGroupingChange: (value) => setGrouping('custos-indiretos-entradas', value),
          onCustomRangeChange: (value) => setCustomRange('custos-indiretos-entradas', value),
        },
      },
      {
        id: 'custos-indiretos-total',
        title: 'Custos Totais',
        subtitle: 'Saídas mensais consolidadas',
        valueType: 'currency',
        series: buildFilteredSeries(
          records,
          ['data', 'dataContrato'],
          (record) => pickNumericValue(record, ['valor', 'custos']),
          chartFilters['custos-indiretos-total'],
        ),
        color: '#F59E0B',
        icon: <WalletOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters['custos-indiretos-total'],
          onPeriodChange: (value) => setPeriod('custos-indiretos-total', value),
          onGroupingChange: (value) => setGrouping('custos-indiretos-total', value),
          onCustomRangeChange: (value) => setCustomRange('custos-indiretos-total', value),
        },
      },
      {
        id: 'custos-indiretos-admin',
        title: 'Custos Administrativos',
        subtitle: 'Despesas administrativas por mês',
        valueType: 'currency',
        series: buildFilteredSeries(
          records,
          ['data', 'dataContrato'],
          (record) => {
            const categoria = String(record.categoria ?? '').toLowerCase();
            return categoria.includes('administr') ? pickNumericValue(record, ['valor', 'custos']) : 0;
          },
          chartFilters['custos-indiretos-admin'],
        ),
        color: '#10B981',
        icon: <DollarCircleOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters['custos-indiretos-admin'],
          onPeriodChange: (value) => setPeriod('custos-indiretos-admin', value),
          onGroupingChange: (value) => setGrouping('custos-indiretos-admin', value),
          onCustomRangeChange: (value) => setCustomRange('custos-indiretos-admin', value),
        },
      },
    ];
  }, [chartFilters, custos, setCustomRange, setGrouping, setPeriod]);

  const fetchCustos = useCallback(async (page = 1, pageSize = DEFAULT_PAGE_SIZE, currentFilters: any = {}) => {
    setLoading(true);
    try {
      const data = await custosIndiretosService.getAll({
        page: page - 1,
        size: pageSize,
        ...currentFilters,
      }) as any;

      if (data && data.content) {
        setCustos(data.content);
        setPagination({
          current: page,
          pageSize,
          total: data.totalElements,
        });
      } else {
        setCustos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar custos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCustos(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchCustos]);

  const handleTableChange = (newPagination: any) => {
    fetchCustos(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (values: any) => {
    const formattedFilters: any = { ...values };
    if (values.dataInicio) {
      formattedFilters.dataInicio = values.dataInicio.format('YYYY-MM-DD');
    }
    if (values.dataFim) {
      formattedFilters.dataFim = values.dataFim.format('YYYY-MM-DD');
    }
    setFilters(formattedFilters);
    fetchCustos(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchCustos(1, pagination.pageSize, {});
  };

  const handleDelete = async (id: number) => {
    try {
      await custosIndiretosService.delete(id);
      message.success('Custo indireto excluído com sucesso');
      fetchCustos(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error('Erro ao excluir custo: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/custos-indiretos/novo');
  };

  const handleEdit = (record: CustoIndireto) => {
    navigate(`/custos-indiretos/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Financeiro' },
          { title: 'Custos Indiretos' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <Space orientation="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Custos Indiretos
          </Title>
          <Text type="secondary">Gerencie despesas administrativas e operacionais fixas.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Custo
        </Button>
      </div>
  
      <CustosIndiretosFilters
        onSearch={handleSearch}
        onClear={handleClear}
      />

      <div className="mb-5">
        <MetricTrendCards cards={trendCards} loading={loading} />
      </div>


      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <CustosIndiretosTable
          dataSource={custos}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
};
