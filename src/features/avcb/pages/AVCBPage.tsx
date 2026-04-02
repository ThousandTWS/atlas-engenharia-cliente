/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Card, Typography, Space, Breadcrumb, App } from "antd";
import type { TableProps } from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AVCBTable } from "../components/AVCBTable";
import type { AVCB } from "../components/AVCBTable";
import { AVCBFilters } from "../components/AVCBFilters";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { useMetricCardFilters } from "../../../shared/hooks/useMetricCardFilters";
import { avcbService } from "../../../core/services/genericService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  buildFilteredSeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";
import { parseExcelNumberRange } from "../../../shared/utils/excelFilterParsers";

const { Title, Text } = Typography;

export const AVCBPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [avcbs, setAvcbs] = useState<AVCB[]>([]);
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

    const allowed = new Set(['situacao', 'valorContrato', 'dataContrato']);
    if (!allowed.has(field)) return undefined;
    return [`${field},${dir}`];
  }, []);

  const cardIds = useMemo(() => ([
    "avcb-processos",
    "avcb-faturamento",
    "avcb-custos",
  ] as const), []);

  const { filters: chartFilters, setPeriod, setGrouping, setCustomRange } = useMetricCardFilters(cardIds);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(avcbs);

    return [
      {
        id: "avcb-processos",
        title: "Entradas AVCB",
        subtitle: "Novos processos por mês",
        valueType: "number",
        series: buildFilteredSeries(records, ["dataContrato", "data"], () => 1, chartFilters["avcb-processos"]),
        color: "#3B82F6",
        icon: <FileTextOutlined />,
        filters: {
          ...chartFilters["avcb-processos"],
          onPeriodChange: (value) => setPeriod("avcb-processos", value),
          onGroupingChange: (value) => setGrouping("avcb-processos", value),
          onCustomRangeChange: (value) => setCustomRange("avcb-processos", value),
        },
      },
      {
        id: "avcb-faturamento",
        title: "Volume Contratado",
        subtitle: "Total mensal em contratos",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["valorContrato", "valor"]),
          chartFilters["avcb-faturamento"],
        ),
        color: "#10B981",
        icon: <DollarCircleOutlined />,
        filters: {
          ...chartFilters["avcb-faturamento"],
          onPeriodChange: (value) => setPeriod("avcb-faturamento", value),
          onGroupingChange: (value) => setGrouping("avcb-faturamento", value),
          onCustomRangeChange: (value) => setCustomRange("avcb-faturamento", value),
        },
      },
      {
        id: "avcb-custos",
        title: "Custos Operacionais",
        subtitle: "Custos mensais por processo",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["custos", "valor"]),
          chartFilters["avcb-custos"],
        ),
        color: "#F59E0B",
        icon: <WalletOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters["avcb-custos"],
          onPeriodChange: (value) => setPeriod("avcb-custos", value),
          onGroupingChange: (value) => setGrouping("avcb-custos", value),
          onCustomRangeChange: (value) => setCustomRange("avcb-custos", value),
        },
      },
    ];
  }, [avcbs, chartFilters, setCustomRange, setGrouping, setPeriod]);

  const fetchAVCBs = useCallback(async (
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

      const data = (await avcbService.getAll({
        page: page - 1,
        size: pageSize,
        ...backendTableFilters,
        sort: backendSort,
      })) as any;

      setAvcbs(data?.content ?? []);
      setPagination({
        current: page,
        pageSize,
        total: data?.totalElements ?? 0,
      });
    } catch (error: any) {
      message.error("Erro ao carregar AVCBs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_PAGE_SIZE, buildBackendFiltersFromTableFilters, buildBackendSortFromSorter, message, tableFilters, tableSorter]);

  useEffect(() => {
    fetchAVCBs(1, DEFAULT_PAGE_SIZE);
  }, [fetchAVCBs]);

  const handleDelete = async (id: number) => {
    try {
      await avcbService.delete(id);
      message.success("AVCB excluído com sucesso");
      fetchAVCBs(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error("Erro ao excluir AVCB: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/cadastros/servicos?tipo=AVCB");
  };

  const handleEdit = (record: AVCB) => {
    navigate(`/avcb/${record.id}/editar`);
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

    fetchAVCBs(
      shouldResetPage ? 1 : current,
      pageSize,
      { filters: normalizedFilters, sorter: nextSortState },
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: "/" },
          { title: "Painéis e Gestão" },
          { title: "Painel AVCB" },
        ]}
        style={{ marginBottom: 16 }}
      />

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
            Painel AVCB
          </Title>
          <Text type="secondary">
            Gerenciamento de Auto de Vistoria do Corpo de Bombeiros.
          </Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          Novo AVCB
        </Button>
      </div>

      <AVCBFilters
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
        <AVCBTable
          dataSource={avcbs}
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
          onView={(record) => message.info(`Visualizar AVCB: ${record.id}`)}
        />
      </Card>
    </div>
  );
};
