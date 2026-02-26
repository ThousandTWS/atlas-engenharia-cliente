/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Card, Typography, Space, Breadcrumb, App } from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  DollarCircleOutlined,
  RiseOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { LancamentosTable } from "../components/LancamentosTable";
import type { Lancamento } from "../components/LancamentosTable";
import { LancamentosFilters } from "../components/LancamentosFilters";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { lancamentosService } from "../../../core/services/genericService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  buildMonthlySeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";

const { Title, Text } = Typography;

export const LancamentosPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(lancamentos);

    return [
      {
        id: "lancamentos-faturamento",
        title: "Faturamento",
        subtitle: "Receita mensal consolidada",
        valueType: "currency",
        series: buildMonthlySeries(
          records,
          ["data", "dataContrato"],
          (record) =>
            pickNumericValue(record, ["faturamento", "valorContrato", "valor"]),
        ),
        color: "#10B981",
        icon: <DollarCircleOutlined />,
      },
      {
        id: "lancamentos-lucro",
        title: "Lucro Líquido",
        subtitle: "Resultado mensal por lançamento",
        valueType: "currency",
        series: buildMonthlySeries(
          records,
          ["data", "dataContrato"],
          (record) => pickNumericValue(record, ["lucro"]),
        ),
        color: "#3B82F6",
        icon: <RiseOutlined />,
      },
      {
        id: "lancamentos-custos",
        title: "Custos Diretos",
        subtitle: "Saídas mensais consolidadas",
        valueType: "currency",
        series: buildMonthlySeries(
          records,
          ["data", "dataContrato"],
          (record) =>
            pickNumericValue(record, ["custoDireto", "custos", "valor"]),
        ),
        color: "#F59E0B",
        icon: <WalletOutlined />,
        inverseTrend: true,
      },
    ];
  }, [lancamentos]);

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await lancamentosService.getAll()) as any;
      if (data && data.content) {
        setLancamentos(data.content);
      } else {
        setLancamentos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error("Erro ao carregar lançamentos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchLancamentos();
  }, [fetchLancamentos]);

  const handleDelete = async (id: number) => {
    try {
      await lancamentosService.delete(id);
      message.success("Lançamento excluído com sucesso");
      fetchLancamentos();
    } catch (error: any) {
      message.error("Erro ao excluir lançamento: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/lancamentos/novo");
  };

  const handleEdit = (record: Lancamento) => {
    navigate(`/lancamentos/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: "/" },
          { title: "Financeiro" },
          { title: "Lançamentos" },
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
            Gestão de Lançamentos
          </Title>
          <Text type="secondary">
            Acompanhe faturamentos, custos e lucratividade dos seus projetos.
          </Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          Novo Lançamento
        </Button>
      </div>

      <LancamentosFilters
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
        <LancamentosTable
          dataSource={lancamentos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) =>
            message.info(`Visualizar lançamento: ${record.codigo}`)
          }
        />
      </Card>
    </div>
  );
};
