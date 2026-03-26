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

export type SituacaoProcesso = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface ProcessoAdm {
  id: number;
  situacao: SituacaoProcesso;
  descricaoSituacao: string;
  nomeCliente: string;
  codigo: string;
  valorContrato: number;
  dataContrato: string;
  descontoNf?: number;
  condicaoPagamento: string;
  proximaParcela: string;
  aReceber: number;
  recebido: number;
  custos: number;
}

interface ProcessosAdmTableProps {
  loading?: boolean;
  dataSource: ProcessoAdm[];
  onEdit: (record: ProcessoAdm) => void;
  onDelete: (id: number) => void;
  onView: (record: ProcessoAdm) => void;
}

export const ProcessosAdmTable: React.FC<ProcessosAdmTableProps> = ({
  loading,
  dataSource,
  onEdit,
  onDelete,
  onView,
}) => {
  const getSituacaoBadgeClass = (situacao: SituacaoProcesso) => {
    const classes: Record<SituacaoProcesso, string> = {
      PENDENTE: 'atlas-status-badge-warning',
      EM_ANDAMENTO: 'atlas-status-badge-info',
      CONCLUIDO: 'atlas-status-badge-success',
      CANCELADO: 'atlas-status-badge-danger',
    };
    return classes[situacao] || 'atlas-status-badge-neutral';
  };

  const{isDarkMode} = useLayout();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Setar se o tema está escuro

  const columns: ColumnsType<ProcessoAdm> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 140,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Cliente',
      dataIndex: 'nomeCliente',
      key: 'nomeCliente',
      ellipsis: true,
    },
    {
      title: 'Situação',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 150,
      render: (situacao: SituacaoProcesso, record) => (
        <Tooltip title={htmlToPlainText(record.descricaoSituacao)}>
          <Tag
            variant="filled"
            className={`atlas-status-badge ${getSituacaoBadgeClass(situacao)}`}
          >
            <span className="atlas-status-badge-dot" />
            {situacao.replace('_', ' ')}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Valor Contrato',
      dataIndex: 'valorContrato',
      key: 'valorContrato',
      width: 150,
      render: (valor: number) => formatCurrency(valor),
      sorter: (a, b) => a.valorContrato - b.valorContrato,
    },
    {
      title: 'Data Contrato',
      dataIndex: 'dataContrato',
      key: 'dataContrato',
      width: 130,
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
          <Tooltip title="Visualizar Detalhes">
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
            title="Excluir Processo"
            description="Tem certeza que deseja excluir este processo administrativo?"
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
        placement:["bottomCenter"],
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total de ${total} processos`,
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
