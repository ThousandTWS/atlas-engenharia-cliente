import React from 'react';
import {
  Table,
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
import type { TablePaginationConfig } from 'antd/es/table/interface';
import type { Cliente } from '../../../core/services/clientesService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Text } = Typography;

interface ClientesTableProps {
  loading?: boolean;
  dataSource: Cliente[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange: (pagination: TablePaginationConfig) => void;
  onEdit: (record: Cliente) => void;
  onDelete: (id: number) => void;
  onView: (record: Cliente) => void;
}

export const ClientesTable: React.FC<ClientesTableProps> = ({
  loading,
  dataSource,
  pagination,
  onChange,
  onEdit,
  onDelete,
  onView,
}) => {
  const { isDarkMode } = useLayout();

  const columns: ColumnsType<Cliente> = [
    {
      title: 'CNPJ/CPF',
      dataIndex: 'cnpjCpf',
      key: 'cnpjCpf',
      width: 170,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Razão Social',
      dataIndex: 'razaoSocial',
      key: 'razaoSocial',
      ellipsis: true,
    },
    {
      title: 'Contato',
      dataIndex: 'nomeContato',
      key: 'nomeContato',
      width: 170,
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Cidade/UF',
      key: 'cidadeEstado',
      width: 140,
      render: (_, record) => `${record.cidade || '-'} / ${record.estado || '-'}`,
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
            title="Excluir Cliente"
            description="Tem certeza que deseja excluir este cliente?"
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
      scroll={{ x: 1200 }}
      pagination={{
        placement: ['bottomCenter'],
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => `Total de ${total} clientes`,
        style: {
          backgroundColor: isDarkMode ? '#0A0F1C' : '#FAFBFC',
          margin: 0,
          padding: '16px',
          borderRadius: '0 0 8px 8px',
        },
      }}
      onChange={onChange}
    />
  );
};
