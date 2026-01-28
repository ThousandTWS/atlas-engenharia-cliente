import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Input, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { avcbService, clcbService, processosAdmService, lancamentosService, custosIndiretosService } from '../../../core/services/genericService';
import { obrasService } from '../../../core/services/obrasService';

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

export const DashboardTableAntd: React.FC = () => {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowData, setRowData] = useState<RowData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [avcbs, clcbs, obras, processos, lancamentos, custos] = await Promise.all([
          avcbService.getAll(),
          clcbService.getAll(),
          obrasService.getAll(),
          processosAdmService.getAll(),
          lancamentosService.getAll(),
          custosIndiretosService.getAll(),
        ]);

        const formatItems = (items: any, tipo: string) => {
          const list = Array.isArray(items) ? items : (items as any).content || [];
          return list.map((item: any) => ({
            id: String(item.id || item.codigo || ''),
            cliente: item.nomeCliente || 'N/A',
            projeto: item.servico || item.projeto || item.descricaoSituacao || item.descricao || tipo,
            status: item.situacao || item.status || (tipo === 'Custo' ? 'PAGO' : 'PENDENTE'),
            valor: item.valorContrato || item.faturamento || item.valor || 0,
            data: item.dataContrato || item.data || new Date().toISOString(),
            tipo: tipo
          }));
        };

        const allItems: RowData[] = [
          ...formatItems(avcbs, 'AVCB'),
          ...formatItems(clcbs, 'CLCB'),
          ...formatItems(obras, 'Obra'),
          ...formatItems(processos, 'Processo Adm'),
          ...formatItems(lancamentos, 'Lançamento'),
          ...formatItems(custos, 'Custo'),
        ];

        // Ordenar por data (mais recentes primeiro)
        allItems.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

        setRowData(allItems);
      } catch (error: any) {
        message.error('Erro ao carregar atividades recentes: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [message]);

  const filteredData = rowData.filter(item => 
    item.cliente.toLowerCase().includes(searchText.toLowerCase()) ||
    item.projeto.toLowerCase().includes(searchText.toLowerCase()) ||
    item.status.toLowerCase().includes(searchText.toLowerCase()) ||
    item.id.includes(searchText) ||
    item.tipo.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
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
      render: (tipo: string) => <Tag color="blue">{tipo}</Tag>,
      filters: [
        { text: 'AVCB', value: 'AVCB' },
        { text: 'CLCB', value: 'CLCB' },
        { text: 'Obra', value: 'Obra' },
        { text: 'Processo Adm', value: 'Processo Adm' },
        { text: 'Lançamento', value: 'Lançamento' },
        { text: 'Custo', value: 'Custo' },
      ],
      onFilter: (value: any, record: RowData) => record.tipo === value,
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
      render: (status: string) => {
        const colors: any = {
          'APROVADO': 'success',
          'CONCLUIDO': 'success',
          'EM_ANDAMENTO': 'warning',
          'EM_ANÁLISE': 'warning',
          'PENDENTE': 'processing',
          'REPROVADO': 'error',
          'CANCELADO': 'error',
          'Aprovado': 'success',
          'Em Análise': 'warning',
          'Pendente': 'processing',
          'Reprovado': 'error'
        };
        return <Tag color={colors[status] || 'default'}>{status.replace('_', ' ')}</Tag>;
      },
      onFilter: (value: any, record: RowData) => record.status === value,
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      width: 140,
      render: (valor: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor),
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
      variant="borderless" 
      loading={loading}
      style={{ 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginTop: '24px'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>Atividades Recentes</Title>
        <Input
          placeholder="Pesquisar..."
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      
      <Table 
        dataSource={filteredData} 
        columns={columns} 
        rowKey={(record) => `${record.tipo}-${record.id}`}
        pagination={{
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
