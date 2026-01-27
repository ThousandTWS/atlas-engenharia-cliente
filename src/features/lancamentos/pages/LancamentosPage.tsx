import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
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
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { LancamentosTable } from '../components/LancamentosTable';
import type { Lancamento } from '../components/LancamentosTable';
import { LancamentosFilters } from '../components/LancamentosFilters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const MOCK_DATA: Lancamento[] = [
  {
    id: 1,
    codigo: 'LANC-A1B2C3D4',
    descricao: 'Compra de materiais hidráulicos',
    faturamento: 5000,
    data: '2023-10-27',
    custoDireto: 2000,
    lucro: 3000,
    observacao: 'Urgente para a obra X'
  },
  {
    id: 2,
    codigo: 'LANC-X9Y8Z7W6',
    descricao: 'Serviço de Terraplanagem',
    faturamento: 12000,
    data: '2023-11-05',
    custoDireto: 8500,
    lucro: 3500,
    observacao: 'Pagamento via boleto'
  }
];

export const LancamentosPage: React.FC = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(MOCK_DATA);

  // Watch fields for profit calculation
  const faturamento = Form.useWatch('faturamento', form);
  const custoDireto = Form.useWatch('custoDireto', form);

  useEffect(() => {
    if (faturamento !== undefined && custoDireto !== undefined) {
      form.setFieldsValue({ lucro: faturamento - custoDireto });
    }
  }, [faturamento, custoDireto, form]);

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      data: values.data.format('YYYY-MM-DD'),
    };

    if (editingLancamento) {
      setLancamentos(prev => prev.map(l => l.id === editingLancamento.id ? { ...l, ...formattedValues } : l));
      message.success('Lançamento atualizado com sucesso');
    } else {
      const newLancamento = {
        ...formattedValues,
        id: Math.floor(Math.random() * 10000),
        codigo: `LANC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      setLancamentos(prev => [newLancamento, ...prev]);
      message.success('Lançamento cadastrado com sucesso');
    }
    setIsModalOpen(false);
    setEditingLancamento(null);
    form.resetFields();
  };

  const handleEdit = (record: Lancamento) => {
    setEditingLancamento(record);
    form.setFieldsValue({
      ...record,
      data: dayjs(record.data),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
    message.success('Lançamento excluído com sucesso');
  };

  const handleOpenAddModal = () => {
    setEditingLancamento(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Financeiro' },
          { title: 'Lançamentos' },
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
            Gestão de Lançamentos
          </Title>
          <Text type="secondary">Acompanhe faturamentos, custos e lucratividade dos seus projetos.</Text>
        </Space>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleOpenAddModal}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Lançamento
        </Button>
      </div>

      <LancamentosFilters 
        onSearch={(values) => console.log('Filtrar:', values)} 
        onClear={() => console.log('Limpar filtros')} 
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <LancamentosTable 
          dataSource={lancamentos} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onView={(record) => message.info(`Visualizar lançamento: ${record.codigo}`)}
        />
      </Card>

      <Modal
        title={editingLancamento ? 'Editar Lançamento' : 'Cadastrar Novo Lançamento'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={800}
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
          <Row gutter={16}>
            <Col xs={24}>
              <Card 
                title={<span><FileTextOutlined /> Informações Gerais</span>} 
                size="small" 
                style={{ marginBottom: 16, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="descricao"
                      label="Descrição do Lançamento"
                      rules={[{ required: true, message: 'Insira a descrição' }]}
                    >
                      <Input placeholder="Ex: Compra de materiais hidráulicos" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="data"
                      label="Data"
                      rules={[{ required: true, message: 'Selecione a data' }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24}>
              <Card 
                title={<span><DollarOutlined /> Valores e Lucratividade</span>} 
                size="small" 
                style={{ marginBottom: 16, background: '#fafafa' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="faturamento"
                      label="Faturamento"
                      rules={[{ required: true, message: 'Informe o faturamento' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="custoDireto"
                      label="Custo Direto"
                      rules={[{ required: true, message: 'Informe o custo' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="lucro"
                      label="Lucro Estimado"
                    >
                      <InputNumber
                        disabled
                        style={{ width: '100%', fontWeight: 'bold' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24}>
              <Form.Item name="observacao" label="Observações">
                <TextArea rows={3} placeholder="Notas adicionais sobre o lançamento..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
              {editingLancamento ? 'Salvar Alterações' : 'Cadastrar Lançamento'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
