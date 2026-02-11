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

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ProcessosAdmFiltersProps {
  onSearch: (values: any) => void;
  onClear: () => void;
  isDarkMode?: boolean;
}

export const ProcessosAdmFilters: React.FC<ProcessosAdmFiltersProps> = ({ onSearch, onClear }) => {
  const [form] = Form.useForm();
  const {isDarkMode} = useLayout()

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Card 
      style={{ marginBottom: 24, borderRadius: 8, background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode?'none' : '1px solid #CBD5E1' }}
      styles={{ body: { padding: '16px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSearch}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={5}>
            <Form.Item name="codigo" label="Código">
              <Input style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="PROC-XXXX" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="nomeCliente" label="Cliente">
              <Input style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Nome do cliente" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Form.Item  name="situacao" label="Situação">
              <Select style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px  #CBD5E1'}} placeholder="Selecione" allowClear>
                <Option value="PENDENTE">Pendente</Option>
                <Option value="EM_ANDAMENTO">Em Andamento</Option>
                <Option value="CONCLUIDO">Concluído</Option>
                <Option value="CANCELADO">Cancelado</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Form.Item name="nf" label="Nota Fiscal">
              <Input style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="NF-XXXX" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={5}>
            <Form.Item name="periodo" label="Período do Contrato">
              <RangePicker  style={{padding:'7px',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : ''}} icon={<ClearOutlined />} onClick={handleClear} >
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
