import React, { useEffect, useMemo, useState } from 'react';
import { App, Breadcrumb, Button, Card, Col, Drawer, Form, Input, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HomeOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { cadastrosApi, type ProviderRecord } from '../cadastrosApi';
import { normalizeCpfCnpjBR, normalizePhoneBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

export const ProvidersRegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderRecord | null>(null);
  const [records, setRecords] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

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

  const columns: ColumnsType<ProviderRecord> = [
    { title: 'Nome', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value || 'Sem nome'}</Text> },
    { title: 'CPF/CNPJ', dataIndex: 'document', key: 'document' },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
    { title: 'E-mail', dataIndex: 'email', key: 'email', responsive: ['lg'] },
    { title: 'Metodo', dataIndex: 'paymentMethod', key: 'paymentMethod', responsive: ['lg'] },
    { title: 'Condição', dataIndex: 'paymentCondition', key: 'paymentCondition', responsive: ['xl'] },
    { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', responsive: ['xl'], render: (value) => dayjs(value).format('DD/MM/YYYY') },
    { title: 'Acoes', key: 'actions', render: (_, record) => <Button onClick={() => openEdit(record)}>Editar</Button> },
  ];

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Cadastros', href: '/cadastros' },
          { title: 'Prestadores' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Space direction="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>Cadastro de Prestadores</Title>
          <Text type="secondary">Base enxuta de prestadores e dados de pagamento.</Text>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} className="prevent-services-button prevent-services-button-primary" onClick={openCreate}>
          Novo prestador
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="prevent-services-filter-card">
            <Input
              className="prevent-services-input"
              placeholder="Buscar por nome, documento, telefone, e-mail ou banco"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card className="prevent-services-table-card">
            <Space style={{ marginBottom: 16 }}>
              <Tag className="prevent-dashboard-meta-chip" bordered={false}>{filtered.length} prestador(es)</Tag>
            </Space>
            <Table rowKey="id" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
      </Row>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        title={editing ? 'Editar prestador' : 'Novo prestador'}
        className="prevent-services-drawer"
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Nome">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="document" label="CPF/CNPJ" normalize={normalizeCpfCnpjBR}>
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="phone" label="Telefone" normalize={normalizePhoneBR}>
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="email" label="E-mail">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Metodo de pagamento">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="paymentCondition" label="Condicao de pagamento">
            <Input className="prevent-services-input" placeholder="Ex: A vista, 30/60 dias" />
          </Form.Item>
          <Form.Item name="pixKey" label="Chave Pix">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="bank" label="Banco">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="agency" label="Agencia">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="account" label="Conta">
            <Input className="prevent-services-input" />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} className="prevent-services-button prevent-services-button-primary">
            Salvar prestador
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};
