import React from 'react';
import {
  Form,
  Input,
  Row,
  Col,
  Select,
  Button,
  Space,
  Card,
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { getFilterCardStyle, getFilterControlStyle, getFilterSecondaryButtonStyle } from '../../../shared/utils/filterFieldStyles';

const ESTADO_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ label: uf, value: uf }));

interface ClientesFiltersProps {
  onSearch: (values: Record<string, unknown>) => void;
  onClear: () => void;
}

export const ClientesFilters: React.FC<ClientesFiltersProps> = ({ onSearch, onClear }) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useLayout();

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
            <Form.Item name="cnpjCpf" label="CNPJ/CPF">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="00.000.000/0000-00" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="razaoSocial" label="Razão Social">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="Nome da empresa" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="nomeContato" label="Contato">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="Nome do contato" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="telefone" label="Telefone">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="(00) 00000-0000" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="email" label="Email">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="cliente@email.com" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="cidade" label="Cidade">
              <Input style={getFilterControlStyle(isDarkMode)} placeholder="Cidade" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="estado" label="Estado (UF)">
              <Select
                style={getFilterControlStyle(isDarkMode)}
                placeholder="UF"
                allowClear
                options={ESTADO_OPTIONS}
              />
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
