import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Input, Space, Table, Tag, Tooltip, Typography } from 'antd';
import {
  AimOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CampaignPerformance } from '../services/adsDataService';
import {
  enrichCampaignMetrics,
  fetchCampaignPerformance,
} from '../services/adsDataService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Text, Title } = Typography;

interface CampaignRow extends CampaignPerformance {
  ctr: number;
  cpc: number;
  taxaConversao: number;
  receitaEstimativa: number;
  roas: number;
}

const typeIcon = (tipo: CampaignPerformance['tipo']) => {
  const commonProps = { style: { fontSize: 14 } } as const;
  switch (tipo) {
    case 'Pesquisa':
      return <AimOutlined {...commonProps} />;
    case 'Display':
      return <AppstoreOutlined {...commonProps} />;
    case 'Vídeo':
      return <VideoCameraOutlined {...commonProps} />;
    case 'PMax':
    default:
      return <ThunderboltOutlined {...commonProps} />;
  }
};

const statusColor = {
  Ativa: 'success',
  Limitada: 'warning',
  Pausada: 'default',
};

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

const percent = (value: number) => `${value.toFixed(2)}%`;

export const CampaignPerformanceTable: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const [data, setData] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchCampaignPerformance();
        setData(enrichCampaignMetrics(response));
      } catch (err) {
        console.error('Erro ao carregar campanhas', err);
        message.error('Não foi possível carregar campanhas.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [message]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter((item) =>
      `${item.nome} ${item.tipo}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const columns: ColumnsType<CampaignRow> = [
    {
      title: 'Campanha',
      dataIndex: 'nome',
      key: 'nome',
      fixed: 'left',
      width: 240,
      render: (text, record) => (
        <Space size={6}>
          <Tag color="#0F9D58" style={{ color: '#fff', borderRadius: 6, padding: '2px 8px' }}>
            {typeIcon(record.tipo)} {record.tipo}
          </Tag>
          <Text strong>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.nome.localeCompare(b.nome),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CampaignPerformance['status']) => (
        <Tag color={statusColor[status] || 'default'} style={{ borderRadius: 6 }}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Ativa', value: 'Ativa' },
        { text: 'Limitada', value: 'Limitada' },
        { text: 'Pausada', value: 'Pausada' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Orçamento diário',
      dataIndex: 'orcamento',
      key: 'orcamento',
      width: 140,
      render: currency,
      sorter: (a, b) => a.orcamento - b.orcamento,
    },
    {
      title: 'Cliques',
      dataIndex: 'cliques',
      key: 'cliques',
      width: 100,
      sorter: (a, b) => a.cliques - b.cliques,
    },
    {
      title: 'Impressões',
      dataIndex: 'impressoes',
      key: 'impressoes',
      width: 120,
      sorter: (a, b) => a.impressoes - b.impressoes,
    },
    {
      title: 'CTR',
      dataIndex: 'ctr',
      key: 'ctr',
      width: 100,
      render: (value: number, record) => (
        <Tooltip title={`Cliques/Impressões de ${record.cliques}/${record.impressoes}`}>{percent(value)}</Tooltip>
      ),
      sorter: (a, b) => a.ctr - b.ctr,
    },
    {
      title: 'CPC médio',
      dataIndex: 'cpc',
      key: 'cpc',
      width: 120,
      render: currency,
      sorter: (a, b) => a.cpc - b.cpc,
    },
    {
      title: 'Custo',
      dataIndex: 'custo',
      key: 'custo',
      width: 120,
      render: currency,
      sorter: (a, b) => a.custo - b.custo,
    },
    {
      title: 'Conversões',
      dataIndex: 'conversoes',
      key: 'conversoes',
      width: 120,
      sorter: (a, b) => a.conversoes - b.conversoes,
    },
    {
      title: 'Taxa de conversão',
      dataIndex: 'taxaConversao',
      key: 'taxaConversao',
      width: 150,
      render: (value: number, record) => (
        <Tooltip title={`Conversões/Cliques de ${record.conversoes}/${record.cliques}`}>{percent(value)}</Tooltip>
      ),
      sorter: (a, b) => a.taxaConversao - b.taxaConversao,
    },
    {
      title: 'ROAS estimado',
      dataIndex: 'roas',
      key: 'roas',
      width: 140,
      render: (value: number, record) => (
        <Tooltip title={`Receita estimada: ${currency(record.receitaEstimativa)}`}>
          {value.toFixed(2)}x
        </Tooltip>
      ),
      sorter: (a, b) => a.roas - b.roas,
    },
  ];

  return (
    <Card
      title={
        <Space direction="vertical" size={0}>
          <Text style={{ color: isDarkMode ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Métricas de performance</Text>
          <Title level={4} style={{ margin: 0 }}>Campanhas por tipo</Title>
        </Space>
      }
      extra={
        <Input
          className="atlas-form-input"
          allowClear
          placeholder="Buscar campanha ou tipo"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
      }
      style={{
        borderRadius: 16,
        boxShadow: isDarkMode ? '0 12px 30px #00000026' : '0 12px 30px #0F172A12',
        background: isDarkMode ? 'linear-gradient(145deg, #0A0F1C 0%, #111827 100%)' : '#fff',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{ pageSize: 6, showSizeChanger: false }}
        scroll={{ x: 1200 }}
        size="middle"
      />
    </Card>
  );
};
