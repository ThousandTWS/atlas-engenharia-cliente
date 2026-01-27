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

export type AVCB = {
  id: number;
  situacao: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  descricaoSituacao: string;
  valorContrato: number;
  dataContrato: string;
  nf: string;
  condicaoPagamento: string;
  aReceber: number;
  recebido: number;
  custos: number;
};

interface AVCBTableProps {
  loading?: boolean;
  dataSource: AVCB[];
  onEdit: (record: AVCB) => void;
  onDelete: (id: number) => void;
  onView: (record: AVCB) => void;
}

export const AVCBTable: React.FC<AVCBTableProps> = ({
  loading,
  dataSource,
  onEdit,
  onDelete,
  onView,
}) => {
  const getStatusColor = (status: AVCB['situacao']) => {
    const colors = {
      PENDENTE: 'orange',
      EM_ANDAMENTO: 'blue',
      CONCLUIDO: 'green',
      CANCELADO: 'red',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<AVCB> = [
    {
      title: 'NF',
      dataIndex: 'nf',
      key: 'nf',
      width: 100,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Situação',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 140,
      render: (status: AVCB['situacao']) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricaoSituacao',
      key: 'descricaoSituacao',
      ellipsis: true,
    },
    {
      title: 'Valor Contrato',
      dataIndex: 'valorContrato',
      key: 'valorContrato',
      width: 140,
      render: (valor: number) => (
        <Text>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(valor)}
        </Text>
      ),
    },
    {
      title: 'Data',
      dataIndex: 'dataContrato',
      key: 'dataContrato',
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
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
            title="Excluir AVCB"
            description="Tem certeza que deseja excluir este AVCB?"
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
