import React, { useEffect, useMemo, useState } from 'react';
import { App, Breadcrumb, Button, Card, Col, Drawer, Form, Input, InputNumber, Row, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HomeOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { cadastrosApi, type BudgetRecord, type ServiceKind } from '../cadastrosApi';
import { normalizePhoneBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

const SERVICE_TYPE_OPTIONS = [
  { label: 'AVCB', value: 'AVCB' },
  { label: 'CLCB', value: 'CLCB' },
  { label: 'Obras', value: 'OBRAS' },
  { label: 'Proc. Adm.', value: 'PROCESSOS_ADM' },
] satisfies { label: string; value: ServiceKind }[];

export const BudgetRegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BudgetRecord | null>(null);
  const [records, setRecords] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const response = await cadastrosApi.getBudgets({ size: 500 });
      setRecords(response.content);
    } catch (error: any) {
      message.error(`Erro ao carregar orcamentos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBudgets();
  }, []);

  const filtered = useMemo(() => records.filter((item) => {
    const haystack = [item.code, item.phone, item.serviceType, item.createdAt, item.totalValue].join(' ').toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  }), [records, searchText]);

  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (record: BudgetRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const onFinish = async (values: { phone: string; serviceType: ServiceKind; totalValue: number }) => {
    try {
      await cadastrosApi.saveBudget({
        id: editingRecord?.id,
        phone: values.phone,
        serviceType: values.serviceType,
        totalValue: Number(values.totalValue || 0),
      });
      await loadBudgets();
      setDrawerOpen(false);
      form.resetFields();
      message.success(editingRecord ? 'Orcamento atualizado.' : 'Orcamento cadastrado.');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const columns: ColumnsType<BudgetRecord> = [
    { title: 'Codigo', dataIndex: 'code', key: 'code', render: (value) => <Text strong>{value}</Text> },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
    { title: 'Tipo', dataIndex: 'serviceType', key: 'serviceType', render: (value) => value === 'PROCESSOS_ADM' ? 'Proc. Adm.' : value },
    {
      title: 'Valor total',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)),
    },
    {
      title: 'Data',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => dayjs(value).format('DD/MM/YYYY'),
    },
    {
      title: 'Acoes',
      key: 'actions',
      render: (_, record) => <Button onClick={() => openEdit(record)}>Editar</Button>,
    },
  ];

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Cadastros', href: '/cadastros' },
          { title: 'Orcamentos' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Space direction="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>Cadastro de Orcamento</Title>
          <Text type="secondary">Registro inicial antes da conversao em servico.</Text>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} className="prevent-services-button prevent-services-button-primary" onClick={openCreate}>
          Novo orcamento
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="prevent-services-filter-card">
            <Input
              className="prevent-services-input"
              placeholder="Buscar por codigo, telefone, tipo, valor ou data"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card className="prevent-services-table-card">
            <Space style={{ marginBottom: 16 }}>
              <Tag className="prevent-dashboard-meta-chip" bordered={false}>{filtered.length} orcamento(s)</Tag>
            </Space>
            <Table rowKey="id" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
      </Row>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        title={editingRecord ? 'Editar orcamento' : 'Novo orcamento'}
        className="prevent-services-drawer"
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="phone" label="Telefone" normalize={normalizePhoneBR} rules={[{ required: true, message: 'Informe o telefone' }]}>
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="serviceType" label="Tipo de servico" rules={[{ required: true, message: 'Selecione o tipo' }]}>
            <Select className="prevent-services-select" options={SERVICE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="totalValue" label="Valor total" rules={[{ required: true, message: 'Informe o valor total' }]}>
            <InputNumber className="prevent-services-number" style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} className="prevent-services-button prevent-services-button-primary">
            Salvar orcamento
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};
