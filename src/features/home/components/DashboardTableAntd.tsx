import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Input, App, Space, type TableProps } from 'antd';
import { ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { htmlToPlainText } from '../../../core/utils/text';
import { useLiveSubscription } from '../../../core/realtime/liveProvider';
import { resolveStatusBadgeClass } from '../utils/projectStatusStrategies';
import { homeDashboardFacade } from '../services/homeDashboardFacade';
import { CollectionComposite, CollectionLeaf } from '../../../core/structural/composite/collectionComposite';
import { formatCurrencyPtBr } from '../../../core/structural/flyweight/numberFormatterFlyweight';


const { Title } = Typography;

interface RowData {
  id: string;
  cliente: string;
  projeto: string;
  status: string;
  valor: number;
  data: string;
  tipo: string;
}

interface GenericItem {
  id?: string | number;
  codigo?: string | number;
  nomeCliente?: string;
  servico?: string;
  projeto?: string;
  descricaoSituacao?: string;
  descricao?: string;
  situacao?: string;
  status?: string;
  valorContrato?: number;
  faturamento?: number;
  valor?: number;
  dataContrato?: string;
  data?: string;
}

type ApiListResponse = GenericItem[] | { content?: GenericItem[] };

export const DashboardTableAntd: React.FC = () => {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowData, setRowData] = useState<RowData[]>([]);
  const {isDarkMode} = useLayout();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await homeDashboardFacade.getSnapshot(0, 500);

        const formatItems = (items: ApiListResponse, tipo: string): RowData[] => {
          const list = Array.isArray(items) ? items : items.content ?? [];
          return list.map((item) => ({
            id: String(item.id ?? item.codigo ?? ''),
            cliente: typeof item.nomeCliente === 'string' ? item.nomeCliente : 'N/A',
            projeto:
              (typeof item.servico === 'string' && item.servico) ||
              (typeof item.projeto === 'string' && item.projeto) ||
              (typeof item.descricaoSituacao === 'string' && htmlToPlainText(item.descricaoSituacao)) ||
              (typeof item.descricao === 'string' && htmlToPlainText(item.descricao)) ||
              tipo,
            status:
              (typeof item.situacao === 'string' && item.situacao) ||
              (typeof item.status === 'string' && item.status) ||
              (tipo === 'Custo' ? 'PAGO' : 'PENDENTE'),
            valor:
              (typeof item.valorContrato === 'number' && item.valorContrato) ||
              (typeof item.faturamento === 'number' && item.faturamento) ||
              (typeof item.valor === 'number' && item.valor) ||
              0,
            data: typeof item.dataContrato === 'string' ? item.dataContrato : typeof item.data === 'string' ? item.data : new Date().toISOString(),
            tipo,
          }));
        };

      const projectsComposite = new CollectionComposite<RowData>();
      projectsComposite.add(new CollectionLeaf(formatItems(snapshot.avcbs as ApiListResponse, 'AVCB')));
      projectsComposite.add(new CollectionLeaf(formatItems(snapshot.clcbs as ApiListResponse, 'CLCB')));
      projectsComposite.add(new CollectionLeaf(formatItems(snapshot.obras as ApiListResponse, 'Obra')));
      projectsComposite.add(new CollectionLeaf(formatItems(snapshot.processos as ApiListResponse, 'Processo Adm')));
      projectsComposite.add(new CollectionLeaf(formatItems(snapshot.lancamentos as ApiListResponse, 'Lançamento')));
      projectsComposite.add(new CollectionLeaf(formatItems(snapshot.custos as ApiListResponse, 'Custo')));

      const allItems: RowData[] = projectsComposite.toArray();

      // Ordenar por data (mais recentes primeiro)
      allItems.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      setRowData(allItems);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      message.error('Erro ao carregar atividades recentes: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useLiveSubscription({
    channel: 'resources.*',
    types: ['created', 'updated', 'deleted'],
    callback: () => {
      fetchData();
    },
  });

  const filteredData = rowData.filter(item => 
    item.cliente.toLowerCase().includes(searchText.toLowerCase()) ||
    item.projeto.toLowerCase().includes(searchText.toLowerCase()) ||
    item.status.toLowerCase().includes(searchText.toLowerCase()) ||
    item.id.includes(searchText) ||
    item.tipo.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: TableProps<RowData>['columns'] = [
    {
      title: 'Código/ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      sorter: (a: RowData, b: RowData) => a.id.localeCompare(b.id),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 120,
      render: (tipo: string) => <Tag style={{color:isDarkMode ? '#ffffff' : '#000'}} >{tipo}</Tag>,
      filters: [
        { text: 'AVCB', value: 'AVCB' },
        { text: 'CLCB', value: 'CLCB' },
        { text: 'Obra', value: 'Obra' },
        { text: 'Processo Adm', value: 'Processo Adm' },
        { text: 'Lançamento', value: 'Lançamento' },
        { text: 'Custo', value: 'Custo' },
      ],
      onFilter: (value, record) => record.tipo === String(value),
    },
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente',
      ellipsis: true,
      sorter: (a: RowData, b: RowData) => a.cliente.localeCompare(b.cliente),
    },
    {
      title: 'Projeto/Serviço',
      dataIndex: 'projeto',
      key: 'projeto',
      ellipsis: true,
      sorter: (a: RowData, b: RowData) => a.projeto.localeCompare(b.projeto),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag
          variant="filled"
          className={`atlas-status-badge ${resolveStatusBadgeClass(status)}`}
          style={{ marginInlineEnd: 0 }}
        >
          <span className="atlas-status-badge-dot" />
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
      onFilter: (value, record) => record.status === String(value),
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      width: 140,
      render: (valor: number) => formatCurrencyPtBr(valor, 2),
      sorter: (a: RowData, b: RowData) => a.valor - b.valor,
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 130,
      render: (data: string) => new Date(data).toLocaleDateString('pt-BR'),
      sorter: (a: RowData, b: RowData) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    }
  ];

  return (
    <Card
      className="recent-activities-card"
      variant="borderless" 
      loading={loading}
      style={{ 
        borderRadius: '12px', 
        boxShadow: '0 5px 8px rgba(0,0,0,0.06)',
        marginTop: '24px',
        background: isDarkMode ? 'linear-gradient(180deg, #1E2A47 0%, #141B2D 100%)' : '#fff'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <div className="atlas-dashboard-table-header">
        <div>
          <Space direction="vertical" size={4}>
            <Title level={4} style={{ margin: 0 }}>Atividades Recentes</Title>
            <Typography.Text type="secondary">
              Eventos consolidados das frentes operacionais, ordenados pelos registros mais recentes.
            </Typography.Text>
          </Space>
        </div>

        <div className="atlas-dashboard-table-tools">
          <Tag className="atlas-dashboard-meta-chip" bordered={false}>
            <ClockCircleOutlined /> {filteredData.length} registros visíveis
          </Tag>

        <Input
          className="recent-activities-search"
          placeholder="Pesquisar..."
          prefix={<SearchOutlined />}
          style={{ width: 250, background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1'  }}
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
        />
        </div>
      </div>

      <Table
        className="recent-activities-table"
        dataSource={filteredData}
        columns={columns} 
        rowKey={(record) => `${record.tipo}-${record.id}`}
        pagination={{
          placement: ['bottomCenter'],
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total de ${total} itens`
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};
