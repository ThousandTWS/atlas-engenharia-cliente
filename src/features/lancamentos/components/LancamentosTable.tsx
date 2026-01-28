import React from 'react';
import {
  Table,
  Space,
  Button,
  Tooltip,
  Popconfirm,
  Typography,
  Tag,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export type Lancamento = {
    obra: string;
  id: number;
  codigo: string;
  descricao: string;
  faturamento: number;
  data: string;
  custoDireto: number;
  lucro: number;
  observacao?: string;
};

interface LancamentosTableProps {
  loading?: boolean;
  dataSource: Lancamento[];
  onEdit: (record: Lancamento) => void;
  onDelete: (id: number) => void;
  onView: (record: Lancamento) => void;
}

export const LancamentosTable: React.FC<LancamentosTableProps> = ({
  loading,
  dataSource,
  onEdit,
  onDelete,
  onView,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns: ColumnsType<Lancamento> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 140,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
      sorter: (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      ellipsis: true,
    },
    {
      title: 'Faturamento',
      dataIndex: 'faturamento',
      key: 'faturamento',
      width: 140,
      align: 'right',
      render: (val: number) => <Text>{formatCurrency(val)}</Text>,
      sorter: (a, b) => a.faturamento - b.faturamento,
    },
    {
      title: 'Custo Direto',
      dataIndex: 'custoDireto',
      key: 'custoDireto',
      width: 140,
      align: 'right',
      render: (val: number) => <Text type="danger">{formatCurrency(val)}</Text>,
    },
    {
      title: 'Lucro',
      dataIndex: 'lucro',
      key: 'lucro',
      width: 140,
      align: 'right',
      render: (val: number) => (
        <Tag color={val >= 0 ? 'success' : 'error'} style={{ fontWeight: 'bold' }}>
          {formatCurrency(val)}
        </Tag>
      ),
      sorter: (a, b) => a.lucro - b.lucro,
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Visualizar">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir Lançamento"
            description="Tem certeza que deseja excluir este lançamento?"
            onConfirm={() => onDelete(record.id)}
            okText="Sim"
            cancelText="Não"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Excluir">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1000 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total de ${total} lançamentos`,
      }}
    />
  );
};
