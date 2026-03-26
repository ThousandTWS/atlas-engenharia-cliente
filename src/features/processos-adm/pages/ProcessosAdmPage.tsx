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
import { ProcessosAdmTable } from "../components/ProcessosAdmTable";
import type { ProcessoAdm } from "../components/ProcessosAdmTable";
import { ProcessosAdmFilters } from "../components/ProcessosAdmFilters";
import { processosAdmService } from "../../../core/services/genericService";
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

const { Title, Text } = Typography;

export const ProcessosAdmPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [processos, setProcessos] = useState<ProcessoAdm[]>([]);
  const [loading, setLoading] = useState(false);

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

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await processosAdmService.getAll()) as any;
      if (data && data.content) {
        setProcessos(data.content);
      } else {
        setProcessos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error("Erro ao carregar processos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const handleDelete = async (id: number) => {
    try {
      await processosAdmService.delete(id);
      message.success("Processo administrativo excluído com sucesso");
      fetchProcessos();
    } catch (error: any) {
      message.error("Erro ao excluir processo: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/processos/novo");
  };

  const handleEdit = (record: ProcessoAdm) => {
    navigate(`/processos/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: "/" },
          { title: "Gestão" },
          { title: "Processos Administrativos" },
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
