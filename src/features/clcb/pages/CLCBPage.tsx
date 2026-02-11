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
  UserOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CLCBTable } from '../components/CLCBTable';
import type { CLCB } from '../components/CLCBTable';
import { CLCBFilters } from '../components/CLCBFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { clcbService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const CLCBPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const {isMobile,sideBarWidth, isDarkMode } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCLCB, setEditingCLCB] = useState<CLCB | null>(null);
  const [clcbs, setClcbs] = useState<CLCB[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCLCBs = async () => {
    setLoading(true);
    try {
      const data = await clcbService.getAll() as any;
      if (data && data.content) {
        setClcbs(data.content);
      } else {
        setClcbs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar CLCBs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCLCBs();
  }, []);

  const onFinish = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      };

      if (editingCLCB) {
        await clcbService.update(editingCLCB.id!, formattedValues);
        message.success('CLCB atualizado com sucesso');
      } else {
        await clcbService.create(formattedValues);
        message.success('CLCB cadastrado com sucesso');
      }
      setIsModalOpen(false);
      setEditingCLCB(null);
      form.resetFields();
      fetchCLCBs();
    } catch (error: any) {
      message.error('Erro ao salvar CLCB: ' + error.message);
    }
  };

  const handleEdit = (record: CLCB) => {
    setEditingCLCB(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await clcbService.delete(id);
      message.success('CLCB excluído com sucesso');
      fetchCLCBs();
    } catch (error: any) {
      message.error('Erro ao excluir CLCB: ' + error.message);
    }
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
        <Space orientation="vertical" size={0}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Situação dos CLCBs"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              clcbs.reduce((acc: Record<string, number>, curr) => {
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
            subtitle="Total em contrato por situação (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              clcbs.reduce((acc: Record<string, number>, curr) => {
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
                title={<span><UserOutlined /> Identificação e Status</span>}
                style={{ marginBottom: 24, borderRadius: 8,  background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1'}}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Insira o nome do cliente' }]}
                    >
                      <Input  style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}placeholder="Ex: Empresa ABC" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="telefone"
                      label="Telefone"
                      rules={[{ required: true, message: 'Insira o telefone' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="(00) 00000-0000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="endereco"
                      label="Endereço"
                      rules={[{ required: true, message: 'Insira o endereço' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} prefix={<EnvironmentOutlined />} placeholder="Rua, número, bairro..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação"
                      rules={[{ required: true, message: 'Selecione a situação' }]}
                    >
                      <Select style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}>
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
                      <DatePicker style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}  format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação"
                    >
                      <TextArea style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} rows={3} placeholder="Ex: Aguardando vistoria..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span><DollarOutlined /> Financeiro</span>}
                style={{ marginBottom: 24, borderRadius: 8,  background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1' }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="nf" label="Nota Fiscal (NF)">
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: NF-100" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Recebido">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="aReceber" label="A Receber">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => value!.replace(/R\$\s?|(\.)/g, '').replace(',', '.')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button style={{background: isDarkMode ? '#171C2A' : '#fff'}} onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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
