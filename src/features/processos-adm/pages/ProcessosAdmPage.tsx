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
import { ProcessosAdmTable } from "../components/ProcessosAdmTable";
import type { ProcessoAdm } from "../components/ProcessosAdmTable";
import { ProcessosAdmFilters } from "../components/ProcessosAdmFilters";
import { processosAdmService } from "../../../core/services/generic/genericService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { useMetricCardFilters } from "../../../shared/hooks/useMetricCardFilters";
import {
  buildFilteredSeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";
import { parseExcelNumberRange } from "../../../shared/utils/excelFilterParsers";

const { Title, Text } = Typography;

export const ProcessosAdmPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [processos, setProcessos] = useState<ProcessoAdm[]>([]);
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
    "processos-adm-entradas",
    "processos-adm-volume",
    "processos-adm-custos",
  ] as const), []);

  const { filters: chartFilters, setPeriod, setGrouping, setCustomRange } = useMetricCardFilters(cardIds);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(processos);

    return [
      {
        id: "processos-adm-entradas",
        title: "Entradas de Processos",
        subtitle: "Novos processos por mês",
        valueType: "number",
        series: buildFilteredSeries(records, ["dataContrato", "data"], () => 1, chartFilters["processos-adm-entradas"]),
        color: "#3B82F6",
        icon: <FileTextOutlined />,
        filters: {
          ...chartFilters["processos-adm-entradas"],
          onPeriodChange: (value) => setPeriod("processos-adm-entradas", value),
          onGroupingChange: (value) => setGrouping("processos-adm-entradas", value),
          onCustomRangeChange: (value) => setCustomRange("processos-adm-entradas", value),
        },
      },
      {
        id: "processos-adm-volume",
        title: "Faturamento",
        subtitle: "Receita mensal consolidada",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["valorContrato", "valor"]),
          chartFilters["processos-adm-volume"],
        ),
        color: "#10B981",
        icon: <DollarCircleOutlined />,
        filters: {
          ...chartFilters["processos-adm-volume"],
          onPeriodChange: (value) => setPeriod("processos-adm-volume", value),
          onGroupingChange: (value) => setGrouping("processos-adm-volume", value),
          onCustomRangeChange: (value) => setCustomRange("processos-adm-volume", value),
        },
      },
      {
        id: "processos-adm-custos",
        title: "Custos Indiretos",
        subtitle: "Saídas mensais consolidadas",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["custos", "valor"]),
          chartFilters["processos-adm-custos"],
        ),
        color: "#F59E0B",
        icon: <WalletOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters["processos-adm-custos"],
          onPeriodChange: (value) => setPeriod("processos-adm-custos", value),
          onGroupingChange: (value) => setGrouping("processos-adm-custos", value),
          onCustomRangeChange: (value) => setCustomRange("processos-adm-custos", value),
        },
      },
    ];
  }, [chartFilters, processos, setCustomRange, setGrouping, setPeriod]);

  const fetchProcessos = useCallback(async (
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

      const data = (await processosAdmService.getAll({
        page: page - 1,
        size: pageSize,
        ...backendTableFilters,
        sort: backendSort,
      })) as any;

      setProcessos(data?.content ?? []);
      setPagination({
        current: page,
        pageSize,
        total: data?.totalElements ?? 0,
      });
    } catch (error: any) {
      message.error("Erro ao carregar processos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_PAGE_SIZE, buildBackendFiltersFromTableFilters, buildBackendSortFromSorter, message, tableFilters, tableSorter]);

  useEffect(() => {
    fetchProcessos(1, DEFAULT_PAGE_SIZE);
  }, [fetchProcessos]);

  const handleDelete = async (id: number) => {
    try {
      await processosAdmService.delete(id);
      message.success("Processo administrativo excluído com sucesso");
      fetchProcessos(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error("Erro ao excluir processo: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/cadastros/servicos?tipo=PROCESSOS_ADM");
  };

  const handleEdit = (record: ProcessoAdm) => {
    navigate(`/processos/${record.id}/editar`);
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

    fetchProcessos(
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
            Processos Administrativos
          </Title>
          <Text type="secondary">
            Gerenciamento de contratos, parcelas e financeiro administrativo.
          </Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          Novo Processo
        </Button>
      </div>

      <ProcessosAdmFilters
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
        <ProcessosAdmTable
          dataSource={processos}
          loading={loading}
          pagination={{
            placement: ['bottomCenter'],
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} processos`,
          }}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) =>
            message.info(`Visualizar processo: ${record.codigo}`)
          }
        />
      </Card>
    </div>
  );
};
