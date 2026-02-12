/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
  Breadcrumb,
  Modal,
  App,
} from 'antd';
import {
  SaveOutlined,
  HomeOutlined,
  PlusOutlined,
  DollarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AVCBTable } from '../components/AVCBTable';
import type { AVCB } from '../components/AVCBTable';
import { AVCBFilters } from '../components/AVCBFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { avcbService } from '../../../core/services/genericService';
  import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const AVCBPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const {isMobile,sideBarWidth, isDarkMode } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAVCB, setEditingAVCB] = useState<AVCB | null>(null);
  const [avcbs, setAvcbs] = useState<AVCB[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAVCBs = async () => {
    setLoading(true);
    try {
      const data = await avcbService.getAll() as any;
      if (data && data.content) {
        setAvcbs(data.content);
      } else {
        setAvcbs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar AVCBs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAVCBs();
  }, []);

  const onFinish = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      };

      if (editingAVCB) {
        await avcbService.update(editingAVCB.id!, formattedValues);
        message.success('AVCB atualizado com sucesso');
      } else {
        await avcbService.create(formattedValues);
        message.success('AVCB cadastrado com sucesso');
      }
      setIsModalOpen(false);
      setEditingAVCB(null);
      form.resetFields();
      fetchAVCBs();
    } catch (error: any) {
      message.error('Erro ao salvar AVCB: ' + error.message);
    }
  };

  const handleEdit = (record: AVCB) => {
    setEditingAVCB(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await avcbService.delete(id);
      message.success('AVCB excluÃ­do com sucesso');
      fetchAVCBs();
    } catch (error: any) {
      message.error('Erro ao excluir AVCB: ' + error.message);
    }
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
        <Space orientation="vertical" size={0}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            type="pie"
            title="Situação dos AVCBs"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              avcbs.reduce((acc: Record<string, number>, curr) => {
                acc[curr.situacao] = (acc[curr.situacao] || 0) + 1;
                return acc;
              }, {})
            ).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
              color: label === 'CONCLUIDO' ? '#52c41a' : label === 'EM_ANDAMENTO' ? '#1890ff' : label === 'PENDENTE' ? '#faad14' : '#ff4d4f'
            }))}
          />
        </Col>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Volume Financeiro por Status"
            subtitle="Total em contrato por situaÃ§Ã£o (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              avcbs.reduce((acc: Record<string, number>, curr) => {
                acc[curr.situacao] = (acc[curr.situacao] || 0) + (curr.valorContrato || 0);
                return acc;
              }, {})
            ).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
              color: label === 'CONCLUIDO' ? '#52c41a' : label === 'EM_ANDAMENTO' ? '#1890ff' : label === 'PENDENTE' ? '#faad14' : '#ff4d4f'
            }))}
          />
        </Col>
      </Row>

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
        style={{ top: 20,
            paddingLeft: isMobile ? 0 : (sideBarWidth / 2 * 2),
            transition: 'padding-left 0.2s ease'
            }}
        destroyOnHidden
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
                style={{ marginBottom: 24, borderRadius: 8,  background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação Atual"
                      rules={[{ required: true, message: 'Selecione a situação atual' }]}
                    >
                      <Select style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}>
                        <Option value="PENDENTE">Pendente</Option>
                        <Option value="EM_ANDAMENTO">Em Andamento</Option>
                        <Option value="CONCLUIDO">ConcluÃ­do</Option>
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
                      <DatePicker style={{ width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="descricao Situacao"
                      label="Descrição da Situação / Observações"
                      rules={[{ required: true, message: 'Insira uma descrição' }]}
                    >
                      <TextArea style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} rows={4} placeholder="Detalhes sobre o andamento do AVCB..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span><DollarOutlined /> Informações Financeiras</span>}
                style={{ marginBottom: 24, borderRadius: 8,  background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1'}}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="nf" label="Nota Fiscal (NF)">
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="NF-000X" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor do Contrato"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: Ã€ vista, 30/60 dias" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Recebido">
                      <InputNumber
                        style={{ width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="aReceber" label="A Receber">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button style={{background: isDarkMode ? '#171C2A' : '#fff'}} onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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




