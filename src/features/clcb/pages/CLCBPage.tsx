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
  UserOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CLCBTable } from '../components/CLCBTable';
import type { CLCB } from '../components/CLCBTable';
import { CLCBFilters } from '../components/CLCBFilters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const MOCK_DATA: CLCB[] = [
  {
    id: 1,
    codigo: 'CLCB-A1B2C3D4',
    nomeCliente: 'Empresa ABC',
    endereco: 'Rua das Flores, 123',
    telefone: '(11) 99999-9999',
    situacao: 'EM_ANDAMENTO',
    descricaoSituacao: 'Em análise técnica',
    valorContrato: 3500,
    nf: 'NF-100',
    dataContrato: '2023-10-27',
    aReceber: 1500,
    recebido: 2000,
    custos: 500,
  },
  {
    id: 2,
    codigo: 'CLCB-Z9Y8X7W6',
    nomeCliente: 'Condomínio Vista Alegre',
    endereco: 'Av. Brasil, 500',
    telefone: '(11) 98888-8888',
    situacao: 'CONCLUIDO',
    descricaoSituacao: 'Certificado emitido',
    valorContrato: 2800,
    nf: 'NF-098',
    dataContrato: '2023-09-15',
    aReceber: 0,
    recebido: 2800,
    custos: 400,
  }
];

export const CLCBPage: React.FC = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCLCB, setEditingCLCB] = useState<CLCB | null>(null);
  const [clcbs, setClcbs] = useState<CLCB[]>(MOCK_DATA);

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      dataContrato: values.dataContrato.format('YYYY-MM-DD'),
    };

    if (editingCLCB) {
      setClcbs(prev => prev.map(c => c.id === editingCLCB.id ? { ...c, ...formattedValues } : c));
      message.success('CLCB atualizado com sucesso');
    } else {
      const newCLCB = {
        ...formattedValues,
        id: Math.floor(Math.random() * 10000),
        codigo: `CLCB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      setClcbs(prev => [newCLCB, ...prev]);
      message.success('CLCB cadastrado com sucesso');
    }
    setIsModalOpen(false);
    setEditingCLCB(null);
    form.resetFields();
  };

  const handleEdit = (record: CLCB) => {
    setEditingCLCB(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setClcbs(prev => prev.filter(c => c.id !== id));
    message.success('CLCB excluído com sucesso');
  };

  const handleOpenAddModal = () => {
    setEditingCLCB(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel CLCB' },
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
            Painel CLCB
          </Title>
          <Text type="secondary">Gerencie Certificados de Licença do Corpo de Bombeiros.</Text>
        </Space>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleOpenAddModal}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo CLCB
        </Button>
      </div>

      <CLCBFilters 
        onSearch={(values) => console.log('Filtrar:', values)} 
        onClear={() => console.log('Limpar filtros')} 
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <CLCBTable 
          dataSource={clcbs} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onView={(record) => message.info(`Visualizar CLCB: ${record.codigo}`)}
        />
      </Card>

      <Modal
        title={editingCLCB ? 'Editar CLCB' : 'Cadastrar Novo CLCB'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        footer={null}
        style={{ top: 20 }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            situacao: 'EM_ANDAMENTO',
            dataContrato: dayjs(),
          }}
          scrollToFirstError
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={14}>
              <Card
                title={<span><UserOutlined /> Identificação e Status</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Insira o nome do cliente' }]}
                    >
                      <Input placeholder="Ex: Empresa ABC" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="telefone"
                      label="Telefone"
                      rules={[{ required: true, message: 'Insira o telefone' }]}
                    >
                      <Input placeholder="(00) 00000-0000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="endereco"
                      label="Endereço"
                      rules={[{ required: true, message: 'Insira o endereço' }]}
                    >
                      <Input prefix={<EnvironmentOutlined />} placeholder="Rua, número, bairro..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação"
                      rules={[{ required: true, message: 'Selecione a situação' }]}
                    >
                      <Select>
                        <Option value="PENDENTE">Pendente</Option>
                        <Option value="EM_ANDAMENTO">Em Andamento</Option>
                        <Option value="CONCLUIDO">Concluído</Option>
                        <Option value="CANCELADO">Cancelado</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dataContrato"
                      label="Data do Contrato"
                      rules={[{ required: true, message: 'Selecione a data' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação"
                    >
                      <TextArea rows={3} placeholder="Ex: Aguardando vistoria..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span><DollarOutlined /> Financeiro</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="nf" label="Nota Fiscal (NF)">
                      <Input placeholder="Ex: NF-100" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Recebido">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="aReceber" label="A Receber">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                  {editingCLCB ? 'Salvar Alterações' : 'Cadastrar CLCB'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
