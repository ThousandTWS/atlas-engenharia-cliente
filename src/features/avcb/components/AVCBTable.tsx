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
import { htmlToPlainText } from '../../../core/utils/text';

const { Text } = Typography;

export type AVCB = {
  id: number;
  situacao: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  descricaoSituacao: string;
  valorContrato: number;
  dataContrato: string;
  descontoNf?: number;
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

  const {isDarkMode} = useLayout();


  const columns: ColumnsType<AVCB> = [
    {
      title: 'Desconto NF',
      dataIndex: 'descontoNf',
      key: 'descontoNf',
      width: 140,
      render: (value: number | undefined) => (
        <Text>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(Number(value || 0))}
        </Text>
      ),
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
      render: (descricao: string) => {
        const plainText = htmlToPlainText(descricao);
        return (
          <Tooltip title={plainText}>
            <Text>{plainText || '-'}</Text>
          </Tooltip>
        );
      },
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
        style: {
          backgroundColor: isDarkMode ? '#0A0F1C' : '#FAFBFC',
          margin: 0,
          padding: '16px',
          borderRadius: '0 0 8px 8px'
        }
      }}
    />
  );
};
