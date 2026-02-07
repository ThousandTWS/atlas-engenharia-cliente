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
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ProcessosAdmTable } from '../components/ProcessosAdmTable';
import type { ProcessoAdm } from '../components/ProcessosAdmTable';
import { ProcessosAdmFilters } from '../components/ProcessosAdmFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { processosAdmService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const ProcessosAdmPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const {isMobile,sideBarWidth, isDarkMode } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoAdm | null>(null);
  const [processos, setProcessos] = useState<ProcessoAdm[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProcessos = async () => {
    setLoading(true);
    try {
      const data = await processosAdmService.getAll() as any;
      if (data && data.content) {
        setProcessos(data.content);
      } else {
        setProcessos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar processos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessos();
  }, []);

  const onFinish = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
        proximaParcela: values.proximaParcela ? values.proximaParcela.format('YYYY-MM-DD') : '',
      };

      if (editingProcesso) {
        await processosAdmService.update(editingProcesso.id!, formattedValues);
        message.success('Processos Adm atualizado com sucesso');
      } else {
        await processosAdmService.create(formattedValues);
        message.success('Processos Adm cadastrado com sucesso');
      }
      setIsModalOpen(false);
      setEditingProcesso(null);
      form.resetFields();
      fetchProcessos();
    } catch (error: any) {
      message.error('Erro ao salvar processo: ' + error.message);
    }
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

  const handleDelete = async (id: number) => {
    try {
      await processosAdmService.delete(id);
      message.success('Processo administrativo excluído com sucesso');
      fetchProcessos();
    } catch (error: any) {
      message.error('Erro ao excluir processo: ' + error.message);
    }
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
        <Space orientation="vertical" size={0}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Situação dos Processos"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              processos.reduce((acc: Record<string, number>, curr) => {
                const situacao = curr.situacao || 'PENDENTE';
                acc[situacao] = (acc[situacao] || 0) + 1;
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
              processos.reduce((acc: Record<string, number>, curr) => {
                const situacao = curr.situacao || 'PENDENTE';
                acc[situacao] = (acc[situacao] || 0) + (curr.valorContrato || 0);
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
        width={isMobile ? '95%' : 1000}
        footer={null}
        style={{
            top: 20,
            paddingLeft: isMobile ? 0 : (sideBarWidth / 2 * 2),
            transition: 'padding-left 0.2s ease',

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
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={12}>
              <Card
                title={<span><UserOutlined /> Identificação e Status</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1' }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Insira o nome do cliente' }]}
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: João da Silva" />
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
                      <DatePicker style={{ width: '100%' ,background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação"
                    >
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: Aguardando assinatura..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card
                title={<span><InfoCircleOutlined /> Documentação e Prazos</span>}
                style={{ borderRadius: 8, background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1' }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="nf" label="Nota Fiscal (NF)">
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="NF-2023-XXX" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="proximaParcela" label="Próxima Parcela">
                      <DatePicker style={{ width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: 30/60 dias ou À vista" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={<span><DollarOutlined /> Financeiro Administrativo</span>}
                style={{ marginBottom: 24, borderRadius: 8, background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1' }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total do Contrato"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="recebido" label="Valor Recebido">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="aReceber" label="Valor a Receber">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos Administrativos">
                      <InputNumber
                        style={{ width: '100%',background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                        formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 32 }}>
                <Button style={{background: isDarkMode ? '#171C2A' : '#fff'}} onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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
