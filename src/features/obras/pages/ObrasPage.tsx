/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Card, Typography, Space, Breadcrumb, App } from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
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
    ) => {
      setLoading(true);
      try {
        const data = await obrasService.getAll({
          page: page - 1,
          size: pageSize,
          ...currentFilters,
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
    [message],
  );

  useEffect(() => {
    fetchObras(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchObras]);

  const handleTableChange = (newPagination: any) => {
    fetchObras(newPagination.current, newPagination.pageSize, filters);
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
    navigate("/obras/novo");
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
        />
      </Card>
    </div>
  );
};
