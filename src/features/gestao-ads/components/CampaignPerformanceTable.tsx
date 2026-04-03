import React, { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Card, Input, Space, Table, Tag, Tooltip, Typography } from 'antd';
import {
  AimOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CampaignPerformance } from '../services/adsDataService';
import {
  enrichCampaignMetrics,
  fetchCampaignPerformance,
} from '../services/adsDataService';
import { normalizeCampaignStatus, normalizeCampaignType } from '../services/adsNormalizationStrategies';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { useCsvExport, useCsvImport } from '../../../core/import-export/hooks';
import { toNumber } from '../../../core/import-export/csv';
import { useNotificationCenter } from '../../../core/notifications/NotificationCenterContext';
import {
  formatCurrencyPtBr,
  formatPercentPtBr,
} from '../../../core/structural/flyweight/numberFormatterFlyweight';

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

const currency = (value: number) => formatCurrencyPtBr(value, 0);

const percent = (value: number) => formatPercentPtBr(value, 2);

export const CampaignPerformanceTable: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const { open } = useNotificationCenter();
  const [data, setData] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const { exportRows, exporting } = useCsvExport<CampaignRow>({
    filename: 'ads-campanhas-performance',
    mapData: (item) => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      status: item.status,
      orcamento: item.orcamento,
      cliques: item.cliques,
      impressoes: item.impressoes,
      custo: item.custo,
      conversoes: item.conversoes,
      ctr: item.ctr.toFixed(2),
      cpc: item.cpc.toFixed(2),
      taxaConversao: item.taxaConversao.toFixed(2),
      roas: item.roas.toFixed(2),
    }),
  });

  const { importFile, importing } = useCsvImport<CampaignPerformance>({
    mapRecord: (row, index) => ({
      id: String(row.id || `import-${index + 1}`),
      nome: row.nome || `Campanha ${index + 1}`,
      tipo: normalizeCampaignType(String(row.tipo || 'Pesquisa')),
      status: normalizeCampaignStatus(String(row.status || 'Ativa')),
      orcamento: toNumber(String(row.orcamento ?? 0)),
      cliques: toNumber(String(row.cliques ?? 0)),
      impressoes: toNumber(String(row.impressoes ?? 0)),
      custo: toNumber(String(row.custo ?? 0)),
      conversoes: toNumber(String(row.conversoes ?? 0)),
    }),
    onImported: async (rows) => {
      const enriched = enrichCampaignMetrics(rows);
      setData(enriched);
      open({
        title: 'Importação concluída',
        description: `${rows.length} campanha(s) importada(s) via CSV.`,
        type: 'success',
      });
    },
  });

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
        <Space orientation="vertical" size={0}>
          <Text style={{ color: isDarkMode ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Métricas de performance</Text>
          <Title level={4} style={{ margin: 0 }}>Campanhas por tipo</Title>
        </Space>
      }
      extra={
        <Space wrap>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                await importFile(file);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Falha ao importar CSV.';
                message.error(errorMessage);
                open({
                  title: 'Erro na importação',
                  description: errorMessage,
                  type: 'error',
                });
              } finally {
                event.target.value = '';
              }
            }}
          />
          <Button
            className="ads-refresh-button"
            icon={<UploadOutlined />}
            loading={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            Importar CSV
          </Button>
          <Button
            className="ads-refresh-button"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={() => {
              exportRows(filteredData);
              open({

                title: 'Exportação concluída',
                description: `${filteredData.length} campanha(s) exportada(s).`,
                type: 'info',
                showToast: false,
              });
            }}
          >
            Exportar CSV
          </Button>
          <Input
            className="atlas-form-input"
            allowClear
            placeholder="Buscar campanha ou tipo"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
        </Space>
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
