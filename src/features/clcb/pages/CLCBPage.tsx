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
import { CLCBTable } from "../components/CLCBTable";
import type { CLCB } from "../components/CLCBTable";
import { CLCBFilters } from "../components/CLCBFilters";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { useMetricCardFilters } from "../../../shared/hooks/useMetricCardFilters";
import { clcbService } from "../../../core/services/genericService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  buildFilteredSeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";

const { Title, Text } = Typography;

export const CLCBPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [clcbs, setClcbs] = useState<CLCB[]>([]);
  const [loading, setLoading] = useState(false);

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

  const fetchCLCBs = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await clcbService.getAll()) as any;
      if (data && data.content) {
        setClcbs(data.content);
      } else {
        setClcbs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error("Erro ao carregar CLCBs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCLCBs();
  }, [fetchCLCBs]);

  const handleDelete = async (id: number) => {
    try {
      await clcbService.delete(id);
      message.success("CLCB excluído com sucesso");
      fetchCLCBs();
    } catch (error: any) {
      message.error("Erro ao excluir CLCB: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/clcb/novo");
  };

  const handleEdit = (record: CLCB) => {
    navigate(`/clcb/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: "/" },
          { title: "Painéis e Gestão" },
          { title: "Painel CLCB" },
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar CLCB: ${record.codigo}`)}
        />
      </Card>
    </div>
  );
};
