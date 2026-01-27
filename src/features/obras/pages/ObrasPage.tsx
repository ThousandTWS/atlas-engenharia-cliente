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
  UserOutlined,
  HomeOutlined,
  PlusOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ObrasTable } from '../components/ObrasTable';
import { ObrasFilters } from '../components/ObrasFilters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Dados mockados para exibição inicial
const MOCK_DATA: any[] = [
  {
    id: 1,
    codigo: 'OBRA-2024-001',
    nomeCliente: 'Construtora Rocha',
    endereco: 'Rua das Palmeiras, 123',
    telefone: '(11) 98888-7777',
    servico: 'Reforma estrutural',
    situacao: 'EM_ANDAMENTO',
    descricaoSituacao: 'Finalizando a fundação',
    valorContrato: 50000,
    dataContrato: '2023-11-01',
    nf: 'NF-100',
    condicaoPagamento: 'Entrada + 3x',
    aReceber: 30000,
    recebido: 20000,
    custos: 15000,
  },
  {
    id: 2,
    codigo: 'OBRA-2024-002',
    nomeCliente: 'Condomínio Solar',
    servico: 'Pintura Fachada',
    situacao: 'PENDENTE',
    valorContrato: 12000,
    dataContrato: '2024-01-15',
  }
];

export const ObrasPage: React.FC = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<any>(null);
  const [obras, setObras] = useState(MOCK_DATA);

  const onFinish = (values: any) => {
    if (editingObra) {
      setObras(prev => prev.map(o => o.id === editingObra.id ? { ...o, ...values } : o));
      message.success('Obra atualizada com sucesso');
    } else {
      const newObra = {
        ...values,
        id: Math.random(),
        codigo: `OBRA-${new Date().getFullYear()}-00${obras.length + 1}`,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      };
      setObras(prev => [newObra, ...prev]);
      message.success('Obra cadastrada com sucesso');
    }
    setIsModalOpen(false);
    setEditingObra(null);
    form.resetFields();
  };

  const handleEdit = (record: any) => {
    setEditingObra(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setObras(prev => prev.filter(o => o.id !== id));
    message.success('Obra excluída com sucesso');
  };

  const handleOpenAddModal = () => {
    setEditingObra(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel de Obras' },
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
            Painel de Obras
          </Title>
          <Text type="secondary">Gerencie todas as obras, contratos e financeiro em um só lugar.</Text>
        </Space>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleOpenAddModal}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Nova Obra
        </Button>
      </div>

      <ObrasFilters 
        onSearch={(values) => console.log('Filtrar:', values)} 
        onClear={() => console.log('Limpar filtros')} 
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <ObrasTable 
          dataSource={obras} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onView={(record) => message.info(`Visualizar obra: ${record.codigo}`)}
        />
      </Card>

      <Modal
        title={editingObra ? 'Editar Obra' : 'Cadastrar Nova Obra'}
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
                title={<span><UserOutlined /> Informações do Cliente e Serviço</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Por favor, insira o nome do cliente' }]}
                    >
                      <Input placeholder="Ex: Construtora Rocha" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="telefone"
                      label="Telefone de Contato"
                      rules={[{ required: true, message: 'Por favor, insira o telefone' }]}
                    >
                      <Input placeholder="(00) 00000-0000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="endereco"
                      label="Endereço da Obra"
                      rules={[{ required: true, message: 'Por favor, insira o endereço' }]}
                    >
                      <Input placeholder="Rua, número, bairro, cidade - UF" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="servico"
                      label="Tipo de Serviço"
                      rules={[{ required: true, message: 'Por favor, descreva o serviço' }]}
                    >
                      <Input placeholder="Ex: Reforma estrutural, Pintura, Elétrica" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação Atual"
                      rules={[{ required: true, message: 'Selecione a situação' }]}
                    >
                      <Select>
                        <Option value="ORCAMENTO">Orçamento</Option>
                        <Option value="PENDENTE">Pendente</Option>
                        <Option value="EM_ANDAMENTO">Em Andamento</Option>
                        <Option value="CONCLUIDO">Concluído</Option>
                        <Option value="SUSPENSO">Suspenso</Option>
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
                      label="Descrição da Situação / Observações"
                    >
                      <TextArea rows={3} placeholder="Detalhes sobre o progresso..." />
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
                      <Input placeholder="NF-000X" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total do Contrato"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input placeholder="Ex: Entrada + 3x" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Valor Recebido">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="aReceber" label="A Receber">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos Estimados">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                  {editingObra ? 'Salvar Alterações' : 'Cadastrar Obra'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
