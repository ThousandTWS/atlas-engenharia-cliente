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
  UserOutlined,
  HomeOutlined,
  PlusOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ObrasTable } from '../components/ObrasTable';
import { ObrasFilters } from '../components/ObrasFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { obrasService } from '../../../core/services/obrasService';
import type { Obra } from '../../../core/services/obrasService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const ObrasPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const {isMobile,sideBarWidth,isDarkMode } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<any>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const fetchObras = async (page = pagination.current, pageSize = pagination.pageSize, currentFilters = filters) => {
    setLoading(true);
    try {
      const data = await obrasService.getAll({
        page: page - 1, // API é zero-based
        size: pageSize,
        ...currentFilters,
      });
      setObras(data.content);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: data.totalElements,
      });
    } catch (error: any) {
      message.error('Erro ao carregar obras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObras();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchObras(newPagination.current, newPagination.pageSize);
  };

  const handleSearch = (values: any) => {
    const formattedFilters: any = { ...values };
    if (values.periodo && values.periodo.length === 2) {
      formattedFilters.dataContratoInicio = values.periodo[0].format('YYYY-MM-DD');
      formattedFilters.dataContratoFim = values.periodo[1].format('YYYY-MM-DD');
      delete formattedFilters.periodo;
    }
    setFilters(formattedFilters);
    fetchObras(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchObras(1, pagination.pageSize, {});
  };

  const onFinish = async (values: any) => {
    try {
      const obraData = {
        ...values,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      };

      if (editingObra) {
        await obrasService.update(editingObra.id, obraData);
        message.success('Obra atualizada com sucesso');
      } else {
        await obrasService.create(obraData);
        message.success('Obra cadastrada com sucesso');
      }
      setIsModalOpen(false);
      setEditingObra(null);
      form.resetFields();
      fetchObras();
    } catch (error: any) {
      message.error('Erro ao salvar obra: ' + error.message);
    }
  };

  const handleEdit = (record: any) => {
    setEditingObra(record);
    form.setFieldsValue({
      ...record,
      dataContrato: dayjs(record.dataContrato),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await obrasService.delete(id);
      message.success('Obra excluída com sucesso');
      fetchObras();
    } catch (error: any) {
      message.error('Erro ao excluir obra: ' + error.message);
    }
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
        <Space orientation="vertical" size={0}>
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
        onSearch={handleSearch} 
        onClear={handleClear} 
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Situação das Obras"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              obras.reduce((acc: Record<string, number>, curr) => {
                acc[curr.situacao] = (acc[curr.situacao] || 0) + 1;
                return acc;
              }, {})
            ).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
              color: label === 'CONCLUIDO' ? '#52c41a' : label === 'EM_ANDAMENTO' ? (isDarkMode ? '#8B5E47': '#1890ff') : label === 'PENDENTE' ? '#faad14' : '#ff4d4f'
            }))}
          />
        </Col>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Volume por Cliente"
            subtitle="Total em contrato por cliente (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              obras.reduce((acc: Record<string, number>, curr) => {
                const cliente = curr.nomeCliente || 'Não informado';
                acc[cliente] = (acc[cliente] || 0) + (curr.valorContrato || 0);
                return acc;
              }, {})
            ).map(([label, value]) => ({
              label,
              value,
            })).sort((a, b) => b.value - a.value).slice(0, 5)}
          />
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <ObrasTable 
          dataSource={obras} 
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
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
                title={<span><UserOutlined /> Informações do Cliente e Serviço</span>}
                style={{ marginBottom: 24, borderRadius: 8 ,  background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1'}}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Por favor, insira o nome do cliente' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}  placeholder="Ex: Construtora Rocha" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="telefone"
                      label="Telefone de Contato"
                      rules={[{ required: true, message: 'Por favor, insira o telefone' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="(00) 00000-0000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="endereco"
                      label="Endereço da Obra"
                      rules={[{ required: true, message: 'Por favor, insira o endereço' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Rua, número, bairro, cidade - UF" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="servico"
                      label="Tipo de Serviço"
                      rules={[{ required: true, message: 'Por favor, descreva o serviço' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: Reforma estrutural, Pintura, Elétrica" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação Atual"
                      rules={[{ required: true, message: 'Selecione a situação' }]}
                    >
                      <Select style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}>
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
                      <DatePicker style={{ width: '100%' ,background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação / Observações"
                    >
                      <TextArea style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} rows={3} placeholder="Detalhes sobre o progresso..." />
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
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="NF-000X" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total do Contrato"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%',  background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: Entrada + 3x" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Valor Recebido">
                      <InputNumber
                        style={{ width: '100%' , background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="aReceber" label="A Receber">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos Estimados">
                      <InputNumber
                        style={{ width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
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
