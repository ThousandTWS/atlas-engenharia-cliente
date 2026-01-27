import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  message,
  Breadcrumb,
  Grid,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  HomeOutlined,
  PlusOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CustosIndiretosTable } from '../components/CustosIndiretosTable';
import type { CustoIndireto } from '../components/CustosIndiretosTable';
import { CustosIndiretosFilters } from '../components/CustosIndiretosFilters';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const MOCK_DATA: CustoIndireto[] = [
  {
    id: 1,
    data: '2023-10-27',
    descricao: 'Aluguel de escritório',
    valor: 2500,
    categoria: 'Administrativo',
  },
  {
    id: 2,
    data: '2023-11-05',
    descricao: 'Internet e Telefonia',
    valor: 350,
    categoria: 'Infraestrutura',
  },
  {
    id: 3,
    data: '2023-11-10',
    descricao: 'Software de Engenharia (SaaS)',
    valor: 1200,
    categoria: 'Administrativo',
  }
];

export const CustosIndiretosPage: React.FC = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoIndireto | null>(null);
  const [custos, setCustos] = useState<CustoIndireto[]>(MOCK_DATA);

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      data: values.data.format('YYYY-MM-DD'),
    };

    if (editingCusto) {
      setCustos(prev => prev.map(c => c.id === editingCusto.id ? { ...c, ...formattedValues } : c));
      message.success('Custo indireto atualizado com sucesso');
    } else {
      const newCusto = {
        ...formattedValues,
        id: Math.floor(Math.random() * 10000),
      };
      setCustos(prev => [newCusto, ...prev]);
      message.success('Custo indireto cadastrado com sucesso');
    }
    setIsModalOpen(false);
    setEditingCusto(null);
    form.resetFields();
  };

  const handleEdit = (record: CustoIndireto) => {
    setEditingCusto(record);
    form.setFieldsValue({
      ...record,
      data: dayjs(record.data),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setCustos(prev => prev.filter(c => c.id !== id));
    message.success('Custo indireto excluído com sucesso');
  };

  const handleOpenAddModal = () => {
    setEditingCusto(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Custos Indiretos' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Space direction="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Custos Indiretos
          </Title>
          <Text type="secondary">Gerencie despesas administrativas e operacionais fixas.</Text>
        </Space>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleOpenAddModal}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Custo
        </Button>
      </div>

      <CustosIndiretosFilters 
        onSearch={(values) => console.log('Filtrar:', values)} 
        onClear={() => console.log('Limpar filtros')} 
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <CustosIndiretosTable 
          dataSource={custos} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      </Card>

      <Modal
        title={editingCusto ? 'Editar Custo Indireto' : 'Cadastrar Novo Custo Indireto'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            data: dayjs(),
          }}
        >
          <Card
            title={<span><FileTextOutlined /> Informações da Despesa</span>}
            style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
          >
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="descricao"
                  label="Descrição"
                  rules={[{ required: true, message: 'Por favor, insira a descrição' }]}
                >
                  <Input placeholder="Ex: Aluguel de escritório" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="categoria"
                  label="Categoria"
                  rules={[{ required: true, message: 'Selecione a categoria' }]}
                >
                  <Select placeholder="Selecione">
                    <Option value="Administrativo">Administrativo</Option>
                    <Option value="Infraestrutura">Infraestrutura</Option>
                    <Option value="Pessoal">Pessoal</Option>
                    <Option value="Marketing">Marketing</Option>
                    <Option value="Outros">Outros</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="data"
                  label="Data"
                  rules={[{ required: true, message: 'Selecione a data' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="valor"
                  label="Valor"
                  rules={[{ required: true, message: 'Insira o valor' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    size="large"
                    formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                    prefix={<DollarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
              {editingCusto ? 'Salvar Alterações' : 'Cadastrar Custo'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
