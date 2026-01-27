import React from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Popconfirm,
  Typography,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export type CLCB = {
  id: number;
  codigo: string;
  nomeCliente: string;
  endereco: string;
  telefone: string;
  situacao: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  descricaoSituacao: string;
  valorContrato: number;
  nf: string;
  dataContrato: string;
  aReceber: number;
  recebido: number;
  custos: number;
};

interface CLCBTableProps {
  loading?: boolean;
  dataSource: CLCB[];
  onEdit: (record: CLCB) => void;
  onDelete: (id: number) => void;
  onView: (record: CLCB) => void;
}

export const CLCBTable: React.FC<CLCBTableProps> = ({
  loading,
  dataSource,
  onEdit,
  onDelete,
  onView,
}) => {
  const getStatusColor = (status: CLCB['situacao']) => {
    const colors = {
      PENDENTE: 'orange',
      EM_ANDAMENTO: 'blue',
      CONCLUIDO: 'green',
      CANCELADO: 'red',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<CLCB> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 130,
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Cliente',
      dataIndex: 'nomeCliente',
      key: 'nomeCliente',
      ellipsis: true,
      sorter: (a, b) => a.nomeCliente.localeCompare(b.nomeCliente),
    },
    {
      title: 'Situação',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 140,
      render: (status: CLCB['situacao']) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Valor Contrato',
      dataIndex: 'valorContrato',
      key: 'valorContrato',
      width: 150,
      render: (valor: number) => (
        <Text>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(valor)}
        </Text>
      ),
      sorter: (a, b) => a.valorContrato - b.valorContrato,
    },
    {
      title: 'Data',
      dataIndex: 'dataContrato',
      key: 'dataContrato',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
      sorter: (a, b) => new Date(a.dataContrato).getTime() - new Date(b.dataContrato).getTime(),
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
            title="Excluir CLCB"
            description="Tem certeza que deseja excluir este registro de CLCB?"
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
        showTotal: (total) => `Total de ${total} registros`,
      }}
    />
  );
};
