/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Card, Typography, Space, App } from "antd";
import type { TableProps } from "antd";
import {
  PlusOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { CLCBTable } from "../components/CLCBTable";
import type { CLCB } from "../components/CLCBTable";
import { CLCBFilters } from "../components/CLCBFilters";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { useMetricCardFilters } from "../../../shared/hooks/useMetricCardFilters";
import { clcbService } from "../../../core/services/generic/genericService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  buildFilteredSeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";
import { parseExcelNumberRange } from "../../../shared/utils/excelFilterParsers";

const { Title, Text } = Typography;

export const CLCBPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [clcbs, setClcbs] = useState<CLCB[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [tableFilters, setTableFilters] = useState<Record<string, (string | number | boolean)[] | null>>({});
  const [tableSorter, setTableSorter] = useState<{ columnKey?: string; order?: 'ascend' | 'descend' } | null>(null);

  const buildBackendFiltersFromTableFilters = useCallback((nextTableFilters: typeof tableFilters) => {
    const backend: any = {};

    const getKeys = (key: string) => {
      const value = nextTableFilters[key];
      if (!value || value.length === 0) return null;
      return value.map(String);
    };

    const codigo = getKeys('codigo');
    if (codigo) backend.codigoIn = codigo;

    const nomeCliente = getKeys('nomeCliente');
    if (nomeCliente) backend.nomeClienteIn = nomeCliente;

    const situacao = getKeys('situacao');
    if (situacao) backend.situacoes = situacao;

    const contractMonths = getKeys('dataContrato');
    if (contractMonths && contractMonths.length > 0) {
      backend.dataContratoMes = contractMonths;
    }

    const valorRange = getKeys('valorContrato')?.find((value) => value.startsWith('range:'));
    if (valorRange) {
      const parsed = parseExcelNumberRange(valorRange);
      if (parsed) {
        if (parsed.onlyPositive) backend.valorContratoMaiorQueZero = true;
        if (parsed.min !== null) backend.valorContratoMin = parsed.min;
        if (parsed.max !== null) backend.valorContratoMax = parsed.max;
      }
    }

    return backend as Record<string, any>;
  }, []);

  const buildBackendSortFromSorter = useCallback((sorter: typeof tableSorter) => {
    if (!sorter?.columnKey || !sorter.order) return undefined;
    const dir = sorter.order === 'ascend' ? 'asc' : 'desc';
    const field = sorter.columnKey;

    const allowed = new Set(['codigo', 'nomeCliente', 'situacao', 'valorContrato', 'dataContrato']);
    if (!allowed.has(field)) return undefined;
    return [`${field},${dir}`];
  }, []);

  const cardIds = useMemo(() => ([
    "clcb-processos",
    "clcb-faturamento",
    "clcb-custos",
  ] as const), []);

  const { filters: chartFilters, setPeriod, setGrouping, setCustomRange } = useMetricCardFilters(cardIds);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(clcbs);

    return [
      {
        id: "clcb-processos",
        title: "Entradas CLCB",
        subtitle: "Novos processos por mês",
        valueType: "number",
        series: buildFilteredSeries(records, ["dataContrato", "data"], () => 1, chartFilters["clcb-processos"]),
        color: "#3B82F6",
        icon: <FileTextOutlined />,
        filters: {
          ...chartFilters["clcb-processos"],
          onPeriodChange: (value) => setPeriod("clcb-processos", value),
          onGroupingChange: (value) => setGrouping("clcb-processos", value),
          onCustomRangeChange: (value) => setCustomRange("clcb-processos", value),
        },
      },
      {
        id: "clcb-faturamento",
        title: "Volume Contratado",
        subtitle: "Total mensal em contratos",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["valorContrato", "valor"]),
          chartFilters["clcb-faturamento"],
        ),
        color: "#10B981",
        icon: <DollarCircleOutlined />,
        filters: {
          ...chartFilters["clcb-faturamento"],
          onPeriodChange: (value) => setPeriod("clcb-faturamento", value),
          onGroupingChange: (value) => setGrouping("clcb-faturamento", value),
          onCustomRangeChange: (value) => setCustomRange("clcb-faturamento", value),
        },
      },
      {
        id: "clcb-custos",
        title: "Custos Operacionais",
        subtitle: "Custos mensais por processo",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["custos", "valor"]),
          chartFilters["clcb-custos"],
        ),
        color: "#F59E0B",
        icon: <WalletOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters["clcb-custos"],
          onPeriodChange: (value) => setPeriod("clcb-custos", value),
          onGroupingChange: (value) => setGrouping("clcb-custos", value),
          onCustomRangeChange: (value) => setCustomRange("clcb-custos", value),
        },
      },
    ];
  }, [chartFilters, clcbs, setCustomRange, setGrouping, setPeriod]);

  const fetchCLCBs = useCallback(async (
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    tableState?: { filters: typeof tableFilters; sorter: typeof tableSorter },
  ) => {
    setLoading(true);
    try {
      const effectiveTableFilters = tableState?.filters ?? tableFilters;
      const effectiveSorter = tableState?.sorter ?? tableSorter;
      const backendTableFilters = buildBackendFiltersFromTableFilters(effectiveTableFilters);
      const backendSort = buildBackendSortFromSorter(effectiveSorter);

      const data = (await clcbService.getAll({
        page: page - 1,
        size: pageSize,
        ...backendTableFilters,
        sort: backendSort,
      })) as any;

      setClcbs(data?.content ?? []);
      setPagination({
        current: page,
        pageSize,
        total: data?.totalElements ?? 0,
      });
    } catch (error: any) {
      message.error("Erro ao carregar CLCBs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_PAGE_SIZE, buildBackendFiltersFromTableFilters, buildBackendSortFromSorter, message, tableFilters, tableSorter]);

  useEffect(() => {
    fetchCLCBs(1, DEFAULT_PAGE_SIZE);
  }, [fetchCLCBs]);

  const handleDelete = async (id: number) => {
    try {
      await clcbService.delete(id);
      message.success("CLCB excluído com sucesso");
      fetchCLCBs(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error("Erro ao excluir CLCB: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/cadastros/servicos?tipo=CLCB");
  };

  const handleEdit = (record: CLCB) => {
    navigate(`/clcb/${record.id}/editar`);
  };

  const handleTableChange: TableProps<any>['onChange'] = (nextPagination, nextFilters, nextSorter, extra) => {
    const normalizedFilters: Record<string, (string | number | boolean)[] | null> = {};
    Object.entries(nextFilters as any).forEach(([key, value]) => {
      normalizedFilters[key] = (value ?? null) as any;
    });
    setTableFilters(normalizedFilters);

    const sortValue = Array.isArray(nextSorter) ? nextSorter[0] : (nextSorter as any);
    const nextSortState = sortValue?.order
      ? { columnKey: String(sortValue.columnKey || sortValue.field || ''), order: sortValue.order }
      : null;
    setTableSorter(nextSortState);

    const pageSize = (nextPagination as any)?.pageSize ?? pagination.pageSize;
    const current = (nextPagination as any)?.current ?? pagination.current;
    const shouldResetPage = extra?.action === 'filter' || extra?.action === 'sort';

    fetchCLCBs(
      shouldResetPage ? 1 : current,
      pageSize,
      { filters: normalizedFilters, sorter: nextSortState },
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <Space orientation="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Painel CLCB
          </Title>
          <Text type="secondary">
            Gerencie Certificados de Licença do Corpo de Bombeiros.
          </Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          Novo CLCB
        </Button>
      </div>

      <CLCBFilters
        onSearch={(values) => console.log("Filtrar:", values)}
        onClear={() => console.log("Limpar filtros")}
      />

      <div className="mb-5">
        <MetricTrendCards cards={trendCards} loading={loading} />
      </div>

      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 8, overflow: "hidden" }}
      >
        <CLCBTable
          dataSource={clcbs}
          loading={loading}
          pagination={{
            placement: ['bottomCenter'],
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} registros`,
          }}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar CLCB: ${record.codigo}`)}
        />
      </Card>
    </div>
  );
};
