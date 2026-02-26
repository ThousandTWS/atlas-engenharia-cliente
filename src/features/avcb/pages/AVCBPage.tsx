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
import { AVCBTable } from "../components/AVCBTable";
import type { AVCB } from "../components/AVCBTable";
import { AVCBFilters } from "../components/AVCBFilters";
import {
  MetricTrendCards,
  type MetricTrendCardDefinition,
} from "../../../shared/components/charts/MetricTrendCards";
import { avcbService } from "../../../core/services/genericService";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import {
  buildMonthlySeries,
  pickNumericValue,
  toSeriesRecords,
} from "../../../shared/utils/metricSeries";

const { Title, Text } = Typography;

export const AVCBPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [avcbs, setAvcbs] = useState<AVCB[]>([]);
  const [loading, setLoading] = useState(false);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(avcbs);

    return [
      {
        id: "avcb-processos",
        title: "Entradas AVCB",
        subtitle: "Novos processos por mês",
        valueType: "number",
        series: buildMonthlySeries(records, ["dataContrato", "data"], () => 1),
        color: "#3B82F6",
        icon: <FileTextOutlined />,
      },
      {
        id: "avcb-faturamento",
        title: "Volume Contratado",
        subtitle: "Total mensal em contratos",
        valueType: "currency",
        series: buildMonthlySeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["valorContrato", "valor"]),
        ),
        color: "#10B981",
        icon: <DollarCircleOutlined />,
      },
      {
        id: "avcb-custos",
        title: "Custos Operacionais",
        subtitle: "Custos mensais por processo",
        valueType: "currency",
        series: buildMonthlySeries(
          records,
          ["dataContrato", "data"],
          (record) => pickNumericValue(record, ["custos", "valor"]),
        ),
        color: "#F59E0B",
        icon: <WalletOutlined />,
        inverseTrend: true,
      },
    ];
  }, [avcbs]);

  const fetchAVCBs = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await avcbService.getAll()) as any;
      if (data && data.content) {
        setAvcbs(data.content);
      } else {
        setAvcbs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error("Erro ao carregar AVCBs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchAVCBs();
  }, [fetchAVCBs]);

  const handleDelete = async (id: number) => {
    try {
      await avcbService.delete(id);
      message.success("AVCB excluído com sucesso");
      fetchAVCBs();
    } catch (error: any) {
      message.error("Erro ao excluir AVCB: " + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate("/avcb/novo");
  };

  const handleEdit = (record: AVCB) => {
    navigate(`/avcb/${record.id}/editar`);
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar AVCB: ${record.nf}`)}
        />
      </Card>
    </div>
  );
};




