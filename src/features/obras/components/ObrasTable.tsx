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
import {useLayout} from "../../../shared/components/layout/LayoutContext.tsx";


const { Text } = Typography;

interface Obra {
  id?: number;
  codigo?: string;
  nomeCliente?: string;
  servico?: string;
  situacao: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  valorContrato?: number;
  dataContrato?: string;
}

interface ObrasTableProps {
  loading?: boolean;
  dataSource: Obra[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange: (pagination: any) => void;
  onEdit: (record: Obra) => void;
  onDelete: (id: number) => void;
  onView: (record: Obra) => void;
}

export const ObrasTable: React.FC<ObrasTableProps> = ({
  loading,
  dataSource,
  pagination,
  onChange,
  onEdit,
  onDelete,
  onView,
}) => {
  const getStatusColor = (status: Obra['situacao']) => {
    const colors = {
      PENDENTE: 'orange',
      EM_ANDAMENTO: 'blue',
      CONCLUIDO: 'green',
      CANCELADO: 'red',
    };
    return colors[status] || 'default';
  };

  const {isDarkMode} = useLayout();


  const columns: ColumnsType<Obra> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Cliente',
      dataIndex: 'nomeCliente',
      key: 'nomeCliente',
      ellipsis: true,
    },
    {
      title: 'Serviço',
      dataIndex: 'servico',
      key: 'servico',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 140,
      render: (status: Obra['situacao']) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Valor',
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
    },
    {
      title: 'Data',
      dataIndex: 'dataContrato',
      key: 'dataContrato',
      width: 120,
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
            title="Excluir Obra"
            description="Tem certeza que deseja excluir esta obra?"
            onConfirm={() => record.id && onDelete(record.id)}
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
        placement :['bottomCenter'],
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => `Total de ${total} obras`,
        style: {
          backgroundColor: isDarkMode ? '#0A0F1C' : '#FAFBFC',
          margin: 0,
          padding: '16px',
          borderRadius: '0 0 8px 8px'
        }
      }}
      onChange={onChange}
    />
  );
};
