import React, { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Col, Drawer, Form, Input, Row, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { cadastrosApi, type ProviderLinkedServiceRecord, type ProviderRecord } from '../cadastrosApi';
import { normalizeCpfCnpjBR, normalizePhoneBR } from '../../../shared/utils/inputFormat';
import { ExcelLikeTable } from '../../../shared/components/table/ExcelLikeTable';

const { Title, Text } = Typography;

export const ProvidersRegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderRecord | null>(null);
  const [records, setRecords] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [servicesDrawerOpen, setServicesDrawerOpen] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesOwner, setServicesOwner] = useState<ProviderRecord | null>(null);
  const [linkedServices, setLinkedServices] = useState<ProviderLinkedServiceRecord[]>([]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await cadastrosApi.getProviders({ size: 500 });
      setRecords(response.content);
    } catch (error: any) {
      message.error(`Erro ao carregar prestadores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, []);

  const filtered = useMemo(() => records.filter((item) => (
    [item.name, item.document, item.phone, item.email, item.paymentMethod, item.paymentCondition, item.pixKey, item.bank]
      .join(' ')
      .toLowerCase()
      .includes(searchText.toLowerCase())
  )), [records, searchText]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (record: ProviderRecord) => {
    setEditing(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const onFinish = async (values: Partial<ProviderRecord>) => {
    try {
      await cadastrosApi.saveProvider({
        ...editing,
        ...values,
      });
      await loadProviders();
      setDrawerOpen(false);
      message.success(editing ? 'Prestador atualizado.' : 'Prestador cadastrado.');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const openServices = async (record: ProviderRecord) => {
    setServicesOwner(record);
    setServicesDrawerOpen(true);
    setServicesLoading(true);
    try {
      const response = await cadastrosApi.getProviderServices(record.id);
      setLinkedServices(response);
    } catch (error: any) {
      message.error(error.message || 'Erro ao carregar serviços do prestador.');
    } finally {
      setServicesLoading(false);
    }
  };

  const columns: ColumnsType<ProviderRecord> = [
    { title: 'Nome', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value || 'Sem nome'}</Text> },
    { title: 'CPF/CNPJ', dataIndex: 'document', key: 'document' },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
    { title: 'E-mail', dataIndex: 'email', key: 'email', responsive: ['lg'] },
    { title: 'Metodo', dataIndex: 'paymentMethod', key: 'paymentMethod', responsive: ['lg'] },
    { title: 'Valores a pagar', dataIndex: 'toPayValue', key: 'toPayValue', responsive: ['lg'], render: (value) => formatCurrency(Number(value || 0)) },
    { title: 'Valores pagos', dataIndex: 'paidValue', key: 'paidValue', responsive: ['lg'], render: (value) => formatCurrency(Number(value || 0)) },
    { title: 'Próximo pagamento', dataIndex: 'nextPaymentDate', key: 'nextPaymentDate', responsive: ['lg'], render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-') },
    { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', responsive: ['xl'], render: (value) => dayjs(value).format('DD/MM/YYYY') },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => openServices(record)}>Visualizar serviços</Button>
          <Button onClick={() => openEdit(record)}>Editar</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Space direction="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>Cadastro de Prestadores</Title>
          <Text type="secondary">Base enxuta de prestadores e dados de pagamento.</Text>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} className="atlas-services-button atlas-services-button-primary" onClick={openCreate}>
          Novo prestador
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="atlas-services-filter-card">
            <Input
              className="atlas-services-input"
              placeholder="Buscar por nome, documento, telefone, e-mail ou banco"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card className="atlas-services-table-card">
            <Space style={{ marginBottom: 16 }}>
              <Tag className="atlas-dashboard-meta-chip" bordered={false}>{filtered.length} prestador(es)</Tag>
            </Space>
            <ExcelLikeTable
              tableId="prestadores"
              rowKey="id"
              loading={loading}
              columns={columns as any}
              dataSource={filtered}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        title={editing ? 'Editar prestador' : 'Novo prestador'}
        className="atlas-services-drawer"
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Nome">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="document" label="CPF/CNPJ" normalize={normalizeCpfCnpjBR}>
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="phone" label="Telefone" normalize={normalizePhoneBR}>
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="email" label="E-mail">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Metodo de pagamento">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="paymentCondition" label="Condicao de pagamento">
            <Input className="atlas-services-input" placeholder="Ex: A vista, 30/60 dias" />
          </Form.Item>
          <Form.Item name="pixKey" label="Chave Pix">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="bank" label="Banco">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="agency" label="Agencia">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="account" label="Conta">
            <Input className="atlas-services-input" />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} className="atlas-services-button atlas-services-button-primary">
            Salvar prestador
          </Button>
        </Form>
      </Drawer>

      <Drawer
        open={servicesDrawerOpen}
        onClose={() => {
          setServicesDrawerOpen(false);
          setServicesOwner(null);
          setLinkedServices([]);
        }}
        width={860}
        title={servicesOwner ? `Serviços vinculados • ${servicesOwner.name || servicesOwner.document}` : 'Serviços vinculados'}
        className="atlas-services-drawer"
      >
        <ExcelLikeTable
          tableId={servicesOwner ? `prestadores-servicos-${servicesOwner.id}` : 'prestadores-servicos'}
          rowKey="linkId"
          loading={servicesLoading}
          dataSource={linkedServices}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1100 }}
          columns={[
            { title: 'Código', dataIndex: 'serviceCode', key: 'serviceCode', width: 150 },
            { title: 'Tipo', dataIndex: 'serviceType', key: 'serviceType', width: 140 },
            { title: 'Subtipo', dataIndex: 'subtype', key: 'subtype', width: 180, responsive: ['lg'] },
            { title: 'Situação', dataIndex: 'situation', key: 'situation', width: 160, responsive: ['lg'] },
            { title: 'A pagar', dataIndex: 'provisionedValue', key: 'provisionedValue', width: 140, render: (v: any) => formatCurrency(Number(v || 0)) },
            { title: 'Pago', dataIndex: 'effectiveValue', key: 'effectiveValue', width: 140, render: (v: any) => formatCurrency(Number(v || 0)) },
            {
              title: 'Próximo pagamento',
              key: 'paymentDate',
              width: 170,
              render: (_: unknown, record: ProviderLinkedServiceRecord) => {
                if (record.confirmed) return '-';
                if (record.paymentDateType === 'TERMINO_SERVICO') return 'No término';
                if (record.paymentDateType === 'A_DEFINIR') return 'A definir';
                return record.paymentDate ? dayjs(record.paymentDate).format('DD/MM/YYYY') : '-';
              },
            },
            {
              title: 'Status',
              key: 'confirmed',
              width: 110,
              render: (_: unknown, record: ProviderLinkedServiceRecord) => (record.confirmed ? <Tag color="green">Pago</Tag> : <Tag color="orange">A pagar</Tag>),
            },
          ] as any}
        />
      </Drawer>
    </div>
  );
};
