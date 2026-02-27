import React from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Popconfirm,
  Typography,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TablePaginationConfig } from "antd/es/table/interface";
import { useLayout } from "../../../shared/components/layout/LayoutContext.tsx";
import { htmlToPlainText } from "../../../core/utils/text";

const { Text } = Typography;

export type CustoIndireto = {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
};

interface CustosIndiretosTableProps {
  loading?: boolean;
  dataSource: CustoIndireto[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange: (pagination: TablePaginationConfig) => void;
  onEdit: (record: CustoIndireto) => void;
  onDelete: (id: number) => void;
}

export const CustosIndiretosTable: React.FC<CustosIndiretosTableProps> = ({
  loading,
  dataSource,
  pagination,
  onChange,
  onEdit,
  onDelete,
}) => {
  const getCategoriaColor = (categoria: string) => {
    const categories: Record<string, string> = {
      Administrativo: "blue",
      Infraestrutura: "purple",
      Pessoal: "green",
      Marketing: "magenta",
      Outros: "default",
    };
    return categories[categoria] || "blue";
  };

  const { isDarkMode } = useLayout();
  const columns: ColumnsType<CustoIndireto> = [
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("pt-BR"),
      sorter: (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    },
    {
      title: "Descrição",
      dataIndex: "descricao",
      key: "descricao",
      ellipsis: true,
      render: (descricao: string) => {
        const plainText = htmlToPlainText(descricao);
        return (
          <Tooltip title={plainText}>
            <Text>{plainText || "-"}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Categoria",
      dataIndex: "categoria",
      key: "categoria",
      width: 150,
      render: (categoria: string) => (
        <Tag color={getCategoriaColor(categoria)}>{categoria}</Tag>
      ),
    },
    {
      title: "Valor",
      dataIndex: "valor",
      key: "valor",
      width: 150,
      render: (valor: number) => (
        <Text strong>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(valor)}
        </Text>
      ),
      sorter: (a, b) => a.valor - b.valor,
    },
    {
      title: "Ações",
      key: "actions",
      fixed: "right",
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir Custo"
            description="Tem certeza que deseja excluir este custo indireto?"
            onConfirm={() => onDelete(record.id)}
            okText="Sim"
            cancelText="Não"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Excluir">
              <Button type="text" danger icon={<DeleteOutlined />} />
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
      scroll={{ x: 800 }}
      pagination={{
        placement: ["bottomCenter"],
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => `Total de ${total} registros`,
        style: {
          backgroundColor: isDarkMode ? "#0A0F1C" : "#FAFBFC",
          margin: 0,
          padding: "16px",
          borderRadius: "0 0 8px 8px",
        },
      }}
      onChange={onChange}
    />
  );
};
