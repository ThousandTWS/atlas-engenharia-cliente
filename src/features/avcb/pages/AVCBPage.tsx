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
  FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AVCBTable } from '../components/AVCBTable';
import type { AVCB } from '../components/AVCBTable';
import { AVCBFilters } from '../components/AVCBFilters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const MOCK_DATA: AVCB[] = [
  {
    id: 1,
    situacao: 'EM_ANDAMENTO',
    descricaoSituacao: 'Aguardando vistoria técnica do corpo de bombeiros',
    valorContrato: 5000,
    dataContrato: '2023-10-27',
    nf: 'NF-001',
    condicaoPagamento: 'À vista',
    aReceber: 2500,
    recebido: 2500,
    custos: 1000,
  },
  {
    id: 2,
    situacao: 'CONCLUIDO',
    descricaoSituacao: 'Certificado emitido e entregue ao cliente',
    valorContrato: 3200,
    dataContrato: '2023-09-15',
    nf: 'NF-088',
    condicaoPagamento: '30 dias',
    aReceber: 0,
    recebido: 3200,
    custos: 800,
  }
];

export const AVCBPage: React.FC = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAVCB, setEditingAVCB] = useState<AVCB | null>(null);
  const [avcbs, setAvcbs] = useState<AVCB[]>(MOCK_DATA);

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      dataContrato: values.dataContrato.format('YYYY-MM-DD'),
    };

    if (editingAVCB) {
      setAvcbs(prev => prev.map(a => a.id === editingAVCB.id ? { ...a, ...formattedValues } : a));
      message.success('AVCB atualizado com sucesso');
    } else {
      const newAVCB = {
        ...formattedValues,
        id: Math.floor(Math.random() * 10000),
      };
      setAvcbs(prev => [newAVCB, ...prev]);
      message.success('AVCB cadastrado com sucesso');
    }
    setIsModalOpen(false);
    setEditingAVCB(null);
    form.resetFields();
  };

  const handleEdit = (record: AVCB) => {
    setEditingAVCB(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setAvcbs(prev => prev.filter(a => a.id !== id));
    message.success('AVCB excluído com sucesso');
  };

  const handleOpenAddModal = () => {
    setEditingAVCB(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel AVCB' },
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
            Painel AVCB
          </Title>
          <Text type="secondary">Gerenciamento de Auto de Vistoria do Corpo de Bombeiros.</Text>
        </Space>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleOpenAddModal}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo AVCB
        </Button>
      </div>

      <AVCBFilters 
        onSearch={(values) => console.log('Filtrar:', values)} 
        onClear={() => console.log('Limpar filtros')} 
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <AVCBTable 
          dataSource={avcbs} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onView={(record) => message.info(`Visualizar AVCB: ${record.nf}`)}
        />
      </Card>

      <Modal
        title={editingAVCB ? 'Editar AVCB' : 'Cadastrar Novo AVCB'}
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
                title={<span><FireOutlined /> Informações do Processo</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
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
                      label="Descrição da Situação / Observações"
                      rules={[{ required: true, message: 'Insira uma descrição' }]}
                    >
                      <TextArea rows={4} placeholder="Detalhes sobre o andamento do AVCB..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span><DollarOutlined /> Financeiro e Documentação</span>}
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
                      label="Valor do Contrato"
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
                      <Input placeholder="Ex: À vista, 30/60 dias" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Recebido">
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
                    <Form.Item name="custos" label="Custos">
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
                  {editingAVCB ? 'Salvar Alterações' : 'Cadastrar AVCB'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
