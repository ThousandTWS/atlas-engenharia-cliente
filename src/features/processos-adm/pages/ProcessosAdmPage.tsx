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
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ProcessosAdmTable } from '../components/ProcessosAdmTable';
import type { ProcessoAdm } from '../components/ProcessosAdmTable';
import { ProcessosAdmFilters } from '../components/ProcessosAdmFilters';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const MOCK_DATA: ProcessoAdm[] = [
  {
    id: 1,
    situacao: 'EM_ANDAMENTO',
    descricaoSituacao: 'Aguardando assinatura do cliente',
    nomeCliente: 'João da Silva',
    codigo: 'PROC-A1B2C3D4',
    valorContrato: 15000.5,
    dataContrato: '2023-10-27',
    nf: 'NF-2023-001',
    condicaoPagamento: '30/60 dias',
    proximaParcela: '2023-11-27',
    aReceber: 10000,
    recebido: 5000.5,
    custos: 2000
  },
  {
    id: 2,
    situacao: 'CONCLUIDO',
    descricaoSituacao: 'Processo finalizado e pago',
    nomeCliente: 'Maria Oliveira',
    codigo: 'PROC-X9Y8Z7W6',
    valorContrato: 8500,
    dataContrato: '2023-09-15',
    nf: 'NF-2023-015',
    condicaoPagamento: 'À vista',
    proximaParcela: '',
    aReceber: 0,
    recebido: 8500,
    custos: 1200
  }
];

export const ProcessosAdmPage: React.FC = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoAdm | null>(null);
  const [processos, setProcessos] = useState<ProcessoAdm[]>(MOCK_DATA);

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      proximaParcela: values.proximaParcela ? values.proximaParcela.format('YYYY-MM-DD') : '',
    };

    if (editingProcesso) {
      setProcessos(prev => prev.map(p => p.id === editingProcesso.id ? { ...p, ...formattedValues } : p));
      message.success('Processo administrativo atualizado com sucesso');
    } else {
      const newProcesso = {
        ...formattedValues,
        id: Math.floor(Math.random() * 10000),
        codigo: `PROC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      setProcessos(prev => [newProcesso, ...prev]);
      message.success('Processo administrativo cadastrado com sucesso');
    }
    setIsModalOpen(false);
    setEditingProcesso(null);
    form.resetFields();
  };

  const handleEdit = (record: ProcessoAdm) => {
    setEditingProcesso(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
      proximaParcela: record.proximaParcela ? dayjs(record.proximaParcela) : null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setProcessos(prev => prev.filter(p => p.id !== id));
    message.success('Processo administrativo excluído com sucesso');
  };

  const handleOpenAddModal = () => {
    setEditingProcesso(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestão' },
          { title: 'Processos Administrativos' },
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
            Processos Administrativos
          </Title>
          <Text type="secondary">Gerenciamento de contratos, parcelas e financeiro administrativo.</Text>
        </Space>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleOpenAddModal}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Processo
        </Button>
      </div>

      <ProcessosAdmFilters 
        onSearch={(values) => console.log('Filtrar:', values)} 
        onClear={() => console.log('Limpar filtros')} 
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <ProcessosAdmTable 
          dataSource={processos} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onView={(record) => message.info(`Visualizar processo: ${record.codigo}`)}
        />
      </Card>

      <Modal
        title={editingProcesso ? `Editar Processo: ${editingProcesso.codigo}` : 'Cadastrar Novo Processo'}
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
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={12}>
              <Card
                title={<span><UserOutlined /> Identificação e Status</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Insira o nome do cliente' }]}
                    >
                      <Input placeholder="Ex: João da Silva" />
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
                  <Col span={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação"
                    >
                      <Input placeholder="Ex: Aguardando assinatura..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card
                title={<span><InfoCircleOutlined /> Documentação e Prazos</span>}
                style={{ borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="nf" label="Nota Fiscal (NF)">
                      <Input placeholder="NF-2023-XXX" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="proximaParcela" label="Próxima Parcela">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input placeholder="Ex: 30/60 dias ou À vista" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={<span><DollarOutlined /> Financeiro Administrativo</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa' }}
              >
                <Row gutter={16}>
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
                    <Form.Item name="recebido" label="Valor Recebido">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="aReceber" label="Valor a Receber">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos Administrativos">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 32 }}>
                <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                  {editingProcesso ? 'Salvar Alterações' : 'Cadastrar Processo'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
