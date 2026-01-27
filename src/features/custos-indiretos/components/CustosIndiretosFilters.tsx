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

const { Option } = Select;

interface CustosIndiretosFiltersProps {
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const CustosIndiretosFilters: React.FC<CustosIndiretosFiltersProps> = ({ onSearch, onClear }) => {
  const [form] = Form.useForm();

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Card 
      style={{ marginBottom: 24, borderRadius: 8 }}
      styles={{ body: { padding: '16px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSearch}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="descricao" label="Descrição">
              <Input placeholder="Buscar por descrição" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="categoria" label="Categoria">
              <Select placeholder="Selecione" allowClear>
                <Option value="Administrativo">Administrativo</Option>
                <Option value="Infraestrutura">Infraestrutura</Option>
                <Option value="Pessoal">Pessoal</Option>
                <Option value="Marketing">Marketing</Option>
                <Option value="Outros">Outros</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="dataInicio" label="Data Início">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Início" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="dataFim" label="Data Fim">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Fim" />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
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
