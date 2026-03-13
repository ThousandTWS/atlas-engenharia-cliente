/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Form,
  Input,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  Card,
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import {useLayout} from "../../../shared/components/layout/LayoutContext.tsx";
import { getFilterCardStyle, getFilterControlStyle, getFilterSecondaryButtonStyle } from '../../../shared/utils/filterFieldStyles';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface CLCBFiltersProps {
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const CLCBFilters: React.FC<CLCBFiltersProps> = ({ onSearch, onClear }) => {
  const [form] = Form.useForm();
  const {isDarkMode} = useLayout();

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Card 
      style={getFilterCardStyle(isDarkMode)}
      styles={{ body: { padding: '16px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSearch}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="codigo" label="Código">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="Buscar por código" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="nomeCliente" label="Cliente">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="Nome do cliente" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="situacao" label="Situação">
              <Select style={getFilterControlStyle(isDarkMode)} placeholder="Selecione" allowClear>
                <Option value="PENDENTE">Pendente</Option>
                <Option value="EM_ANDAMENTO">Em Andamento</Option>
                <Option value="CONCLUIDO">Concluído</Option>
                <Option value="CANCELADO">Cancelado</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="nf" label="Nota Fiscal">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="Número da NF" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item  name="periodo" label="Período do Contrato">
              <RangePicker style={getFilterControlStyle(isDarkMode, '100%')} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button style={getFilterSecondaryButtonStyle(isDarkMode)} icon={<ClearOutlined />} onClick={handleClear}>
              Limpar
            </Button>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
              Filtrar
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};
