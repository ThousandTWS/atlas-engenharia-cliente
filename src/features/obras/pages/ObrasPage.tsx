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
import dayjs from "dayjs";
import { ObrasTable } from "../components/ObrasTable";
import { ObrasFilters } from "../components/ObrasFilters";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { useMetricCardFilters } from "../../../shared/hooks/useMetricCardFilters";
import { obrasService } from "../../../core/services/obrasService";
import type { Obra } from "../../../core/services/obrasService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  buildFilteredSeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";

const { Title, Text } = Typography;

export const ObrasPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [tableFilters, setTableFilters] = useState<Record<string, (string | number | boolean)[] | null>>({});
  const [tableSorter, setTableSorter] = useState<{ columnKey?: string; order?: 'ascend' | 'descend' } | null>(null);

  const buildBackendFiltersFromTableFilters = useCallback((nextTableFilters: typeof tableFilters) => {
    return buildBackendFiltersFromTableFiltersInternal(nextTableFilters);
  }, []);

  const buildBackendFiltersFromTableFiltersInternal = useCallback((nextTableFilters: typeof tableFilters, omitKey?: string) => {
    const backend: any = {};

    const getKeys = (key: string) => {
      if (omitKey && omitKey === key) return null;
      const value = nextTableFilters[key];
      if (!value || value.length === 0) return null;
      return value.map(String);
    };

    // List filters (single or multiple selections) -> envia como listas para o backend
    const codigo = getKeys('codigo');
    if (codigo) backend.codigoIn = codigo;

    const nomeCliente = getKeys('nomeCliente');
    if (nomeCliente) backend.nomeClienteIn = nomeCliente;

    const servico = getKeys('servico');
    if (servico) backend.servicoIn = servico;

    const situacao = getKeys('situacao');
    if (situacao) backend.situacoes = situacao;

    // Date filter from ExcelLikeTable uses YYYY-MM keys (não-contíguos)
    const contractMonths = getKeys('dataContrato');
    if (contractMonths && contractMonths.length > 0) {
      const normalizedMonths = contractMonths
        .map((raw) => String(raw || '').trim())
        .filter((raw) => /^\d{4}-\d{2}$/.test(raw))
        .sort((a, b) => a.localeCompare(b));

      if (normalizedMonths.length > 0) {
        // Backend já suporta múltiplos meses (não-contíguos) via dataContratoMes=YYYY-MM repetido
        backend.dataContratoMes = normalizedMonths;
      }
    }

    const valorRange = getKeys('valorContrato')?.find((value) => value.startsWith('range:'));
    if (valorRange) {
      const body = valorRange.slice('range:'.length);
      const [minRaw, maxRaw, posRaw] = body.split(':');
      const min = minRaw ? Number(minRaw) : null;
      const max = maxRaw ? Number(maxRaw) : null;
      const onlyPositive = posRaw === '1';

      if (onlyPositive) backend.valorContratoMaiorQueZero = true;
      if (min !== null && Number.isFinite(min)) backend.valorContratoMin = min;
      if (max !== null && Number.isFinite(max)) backend.valorContratoMax = max;
    }

    return backend as Record<string, any>;
  }, []);

  const buildBackendSortFromSorter = useCallback((sorter: typeof tableSorter) => {
    if (!sorter?.columnKey || !sorter.order) return undefined;
    const dir = sorter.order === 'ascend' ? 'asc' : 'desc';
    const field = sorter.columnKey;

    const allowed = new Set(['codigo', 'nomeCliente', 'servico', 'situacao', 'valorContrato', 'dataContrato']);
    if (!allowed.has(field)) return undefined;
    return [`${field},${dir}`];
  }, []);

  const cardIds = useMemo(() => ([
    "obras-processos",
    "obras-faturamento",
    "obras-custos",
  ] as const), []);

  const {
    filters: chartFilters,
    setPeriod,
    setGrouping,
    setCustomRange,
  } = useMetricCardFilters(cardIds);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(obras);

    return [
      {
        id: "obras-processos",
        title: "Entradas de Obras",
        subtitle: "Novos contratos por mês",
        valueType: "number",
        series: buildFilteredSeries(records, ["dataContrato", "data"], () => 1, chartFilters["obras-processos"]),
        color: "#3B82F6",
        icon: <FileTextOutlined />,
        filters: {
          ...chartFilters["obras-processos"],
          onPeriodChange: (value) => setPeriod("obras-processos", value),
          onGroupingChange: (value) => setGrouping("obras-processos", value),
          onCustomRangeChange: (value) => setCustomRange("obras-processos", value),
        },
      },
      {
        id: "obras-faturamento",
        title: "Volume Contratado",
        subtitle: "Total mensal em contratos",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["valorContrato", "valor"]),
          chartFilters["obras-faturamento"],
        ),
        color: "#10B981",
        icon: <DollarCircleOutlined />,
        filters: {
          ...chartFilters["obras-faturamento"],
          onPeriodChange: (value) => setPeriod("obras-faturamento", value),
          onGroupingChange: (value) => setGrouping("obras-faturamento", value),
          onCustomRangeChange: (value) => setCustomRange("obras-faturamento", value),
        },
      },
      {
        id: "obras-custos",
        title: "Custos de Obras",
        subtitle: "Custos mensais consolidados",
        valueType: "currency",
        series: buildFilteredSeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["custos", "valor"]),
          chartFilters["obras-custos"],
        ),
        color: "#F59E0B",
        icon: <WalletOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters["obras-custos"],
          onPeriodChange: (value) => setPeriod("obras-custos", value),
          onGroupingChange: (value) => setGrouping("obras-custos", value),
          onCustomRangeChange: (value) => setCustomRange("obras-custos", value),
        },
      },
    ];
  }, [chartFilters, obras, setCustomRange, setGrouping, setPeriod]);

  const fetchObras = useCallback(
    async (
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      currentFilters: any = {},
      tableState?: { filters: typeof tableFilters; sorter: typeof tableSorter },
    ) => {
      setLoading(true);
      try {
        const effectiveTableFilters = tableState?.filters ?? tableFilters;
        const effectiveSorter = tableState?.sorter ?? tableSorter;
        const backendTableFilters = buildBackendFiltersFromTableFilters(effectiveTableFilters);
        const backendSort = buildBackendSortFromSorter(effectiveSorter);

        const data = await obrasService.getAll({
          page: page - 1,
          size: pageSize,
          ...currentFilters,
          ...backendTableFilters,
          sort: backendSort,
        });
        setObras(data.content);
        setPagination({
          current: page,
          pageSize,
          total: data.totalElements,
        });
      } catch (error: any) {
        message.error("Erro ao carregar obras: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [buildBackendFiltersFromTableFilters, buildBackendSortFromSorter, message, tableFilters, tableSorter],
  );

  const loadFilterOptions = useCallback(async (
    field: 'codigo' | 'nomeCliente' | 'servico' | 'situacao' | 'dataContrato'
  ) => {
    const omitKey = field;
    const backendTableFilters = buildBackendFiltersFromTableFiltersInternal(tableFilters, omitKey);
    const data = await obrasService.getDistinct({
      field,
      limit: 500,
      ...filters,
      ...backendTableFilters,
    });

    return (data || []).map((value) => {
      const raw = String(value || '').trim();
      if (!raw) {
        return { key: '', label: '(vazio)' };
      }
      if (field === 'situacao') {
        return { key: raw, label: raw.replaceAll('_', ' ') };
      }
      if (field === 'dataContrato') {
        return { key: raw, label: dayjs(`${raw}-01`).isValid() ? dayjs(`${raw}-01`).format('MMM/YYYY') : raw };
      }
      return { key: raw, label: raw };
    }).filter((opt, idx, arr) => arr.findIndex((x) => x.key === opt.key) === idx);
  }, [buildBackendFiltersFromTableFiltersInternal, filters, tableFilters]);

  useEffect(() => {
    fetchObras(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchObras]);

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
    fetchObras(
      shouldResetPage ? 1 : current,
      pageSize,
      filters,
      { filters: normalizedFilters, sorter: nextSortState },
    );
  };

  const handleSearch = (values: any) => {
    const formattedFilters: any = { ...values };
    if (values.periodo && values.periodo.length === 2) {
      formattedFilters.dataContratoInicio =
        values.periodo[0].format("YYYY-MM-DD");
      formattedFilters.dataContratoFim = values.periodo[1].format("YYYY-MM-DD");
      delete formattedFilters.periodo;
    }
    setFilters(formattedFilters);
    fetchObras(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchObras(1, pagination.pageSize, {});
  };

  const handleDelete = async (id: number) => {
    try {
      await obrasService.delete(id);
      message.success("Obra excluída com sucesso");
      fetchObras(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error("Erro ao excluir obra: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/cadastros/servicos?tipo=OBRAS");
  };

  const handleEdit = (record: any) => {
    if (!record?.id) {
      message.warning("Obra inválida para edição.");
      return;
    }
    navigate(`/obras/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: "/" },
          { title: "Painéis e Gestão" },
          { title: "Painel de Obras" },
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
            Painel de Obras
          </Title>
          <Text type="secondary">
            Gerencie todas as obras, contratos e financeiro em um só lugar.
          </Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          Nova Obra
        </Button>
      </div>

      <ObrasFilters onSearch={handleSearch} onClear={handleClear} />

      <div className="mb-5">
        <MetricTrendCards cards={trendCards} loading={loading} />
      </div>

      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 8, overflow: "hidden" }}
      >
        <ObrasTable
          dataSource={obras}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar obra: ${record.codigo}`)}
          loadFilterOptions={loadFilterOptions}
        />
      </Card>
    </div>
  );
};
