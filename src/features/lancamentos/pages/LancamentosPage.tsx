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
  Breadcrumb,
  Grid,
  Modal,
  App,
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
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { lancamentosService } from '../../../core/services/genericService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

export const LancamentosPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);

  // Watch fields for profit calculation
  const faturamento = Form.useWatch('faturamento', form);
  const custoDireto = Form.useWatch('custoDireto', form);

  const fetchLancamentos = async () => {
    setLoading(true);
    try {
      const data = await lancamentosService.getAll() as any;
      if (data && data.content) {
        setLancamentos(data.content);
      } else {
        setLancamentos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar lançamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLancamentos();
  }, []);

  useEffect(() => {
    if (faturamento !== undefined && custoDireto !== undefined) {
      form.setFieldsValue({ lucro: faturamento - custoDireto });
    }
  }, [faturamento, custoDireto, form]);

  const onFinish = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        data: values.data.format('YYYY-MM-DD'),
      };

      if (editingLancamento) {
        await lancamentosService.update(editingLancamento.id!, formattedValues);
        message.success('Lançamento atualizado com sucesso');
      } else {
        await lancamentosService.create(formattedValues);
        message.success('Lançamento cadastrado com sucesso');
      }
      setIsModalOpen(false);
      setEditingLancamento(null);
      form.resetFields();
      fetchLancamentos();
    } catch (error: any) {
      message.error('Erro ao salvar lançamento: ' + error.message);
    }
  };

  const handleEdit = (record: Lancamento) => {
    setEditingLancamento(record);
    form.setFieldsValue({
      ...record,
      data: dayjs(record.data),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await lancamentosService.delete(id);
      message.success('Lançamento excluído com sucesso');
      fetchLancamentos();
    } catch (error: any) {
      message.error('Erro ao excluir lançamento: ' + error.message);
    }
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
        <Space orientation="vertical" size={0}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Evolução Mensal"
            subtitle="Faturamento bruto por mês (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              lancamentos.reduce((acc: Record<string, number>, curr) => {
                const month = dayjs(curr.data).format('MMM/YY');
                acc[month] = (acc[month] || 0) + (curr.faturamento || 0);
                return acc;
              }, {})
            ).map(([label, value]) => ({ label, value })).slice(-6)}
          />
        </Col>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Lucratividade"
            subtitle="Lucro líquido por lançamento (R$)"
            loading={loading}
            valuePrefix="R$"
            data={lancamentos.slice(-6).map(l => ({
              label: (l as any).obra || 'S/N',
              value: (l.lucro || 0),
              color: (l.lucro || 0) > 0 ? '#52c41a' : '#ff4d4f'
            }))}
          />
        </Col>
      </Row>

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
        destroyOnHidden
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
                        parser={(value) => value!.replace(/R\$\s?|(,)/g, '')}
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
