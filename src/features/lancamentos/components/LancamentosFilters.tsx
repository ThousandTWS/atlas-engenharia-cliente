import React from 'react';
import {
  Form,
  Input,
  Row,
  Col,
  DatePicker,
  Button,
  Space,
  Card,
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

interface LancamentosFiltersProps {
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const LancamentosFilters: React.FC<LancamentosFiltersProps> = ({ onSearch, onClear }) => {
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
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="codigo" label="Código">
              <Input placeholder="Buscar por código" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="descricao" label="Descrição">
              <Input placeholder="Buscar por descrição" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Form.Item name="periodo" label="Período">
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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
