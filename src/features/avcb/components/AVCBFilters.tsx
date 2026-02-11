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
import { useLayout } from "../../../shared/components/layout/LayoutContext.tsx";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AVCBFiltersProps {
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const AVCBFilters: React.FC<AVCBFiltersProps> = ({ onSearch, onClear }) => {
  const [form] = Form.useForm();
  const {isDarkMode} = useLayout();
  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Card 
      style={{ marginBottom: 24, borderRadius: 8, background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1'}}
      styles={{ body: { padding: '16px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSearch}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="nf" label="Nota Fiscal (NF)">
                <Input style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1'}} placeholder="Buscar por NF" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="situacao" label="Situação">
              <Select style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1'}} placeholder="Selecione" allowClear>
                <Option value="PENDENTE">Pendente</Option>
                <Option value="EM_ANDAMENTO">Em Andamento</Option>
                <Option value="CONCLUIDO">Concluído</Option>
                <Option value="CANCELADO">Cancelado</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Form.Item  name="periodo" label="Período do Contrato">
              <RangePicker style={{padding:'7px', width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button style={{background: isDarkMode ? '#171C2A' : '#fff'}} icon={<ClearOutlined />} onClick={handleClear}>
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
