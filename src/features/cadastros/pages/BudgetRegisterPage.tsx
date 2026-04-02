import React, { useEffect, useMemo, useState } from 'react';
import { App, Breadcrumb, Button, Card, Checkbox, Col, Divider, Drawer, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HomeOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { cadastrosApi, type BudgetRecord, type BudgetSituationRecord, type ServiceKind } from '../cadastrosApi';
import { normalizePhoneBR } from '../../../shared/utils/inputFormat';
import { ExcelLikeTable } from '../../../shared/components/table/ExcelLikeTable';

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
  const [situationForm] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BudgetRecord | null>(null);
  const [records, setRecords] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [situations, setSituations] = useState<BudgetSituationRecord[]>([]);
  const [newSituationLabel, setNewSituationLabel] = useState('');
  const [newSituationClosed, setNewSituationClosed] = useState(false);
  const [manageSituationsOpen, setManageSituationsOpen] = useState(false);
  const [editingSituation, setEditingSituation] = useState<BudgetSituationRecord | null>(null);

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

  const loadSituations = async () => {
    try {
      const response = await cadastrosApi.getBudgetSituations();
      setSituations(response);
    } catch (error: any) {
      message.error(`Erro ao carregar situacoes: ${error.message}`);
    }
  };

  useEffect(() => {
    void loadBudgets();
    void loadSituations();
  }, []);

  const filtered = useMemo(() => records.filter((item) => {
    const haystack = [
      item.code,
      item.name,
      item.description,
      item.situation,
      item.phone,
      item.serviceType,
      item.createdAt,
      item.totalValue,
    ].join(' ').toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  }), [records, searchText]);

  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ situation: 'Enviado' });
    setDrawerOpen(true);
  };

  const openEdit = (record: BudgetRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const onFinish = async (values: { name: string; description?: string; situation: string; phone: string; serviceType: ServiceKind; totalValue: number }) => {
    try {
      await cadastrosApi.saveBudget({
        id: editingRecord?.id,
        name: values.name,
        description: values.description,
        situation: values.situation,
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

  const situationMap = useMemo(() => new Map(situations.map((item) => [item.label, item])), [situations]);

  const resolveSituationTagColor = (label?: string) => {
    const normalized = (label || '').toLowerCase();
    const meta = label ? situationMap.get(label) : undefined;
    if (meta?.closed || normalized.includes('fechado')) return 'green';
    if (normalized.includes('perdid')) return 'red';
    if (normalized.includes('descont')) return 'gold';
    return 'blue';
  };

  const columns: ColumnsType<BudgetRecord> = [
    { title: 'Codigo', dataIndex: 'code', key: 'code', render: (value) => <Text strong>{value}</Text> },
    { title: 'Nome', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
    { title: 'Tipo', dataIndex: 'serviceType', key: 'serviceType', render: (value) => value === 'PROCESSOS_ADM' ? 'Proc. Adm.' : value },
    { title: 'Descricao', dataIndex: 'description', key: 'description', ellipsis: true, render: (value) => value || '-' },
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
      title: 'Tempo',
      key: 'elapsed',
      render: (_: unknown, record) => {
        const created = dayjs(record.createdAt);
        const days = created.isValid() ? Math.max(0, dayjs().diff(created, 'day')) : 0;
        const weeks = Math.floor(days / 7);
        const label = weeks <= 0 ? '< 1 sem' : `${weeks} sem`;
        return (
          <Tooltip title={`${days} dia(s)`}>
            <span>{label}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Situacao',
      dataIndex: 'situation',
      key: 'situation',
      render: (value) => (
        <Tag color={resolveSituationTagColor(String(value || 'Enviado'))} style={{ marginInlineEnd: 0 }}>
          {String(value || 'Enviado')}
        </Tag>
      ),
    },
    {
      title: 'Acoes',
      key: 'actions',
      render: (_, record) => <Button onClick={() => openEdit(record)}>Editar</Button>,
    },
  ];

  const openEditSituation = (record: BudgetSituationRecord) => {
    setEditingSituation(record);
    situationForm.setFieldsValue({ label: record.label, closed: record.closed });
  };

  const saveSituation = async () => {
    const values = await situationForm.validateFields();
    const label = String(values.label || '').trim();
    const closed = Boolean(values.closed);
    if (!label) return;

    try {
      if (editingSituation) {
        await cadastrosApi.updateBudgetSituation(editingSituation.id, { label, closed });
        message.success('Situação atualizada.');
      } else {
        await cadastrosApi.createBudgetSituation({ label, closed });
        message.success('Situação criada.');
      }
      setEditingSituation(null);
      situationForm.resetFields();
      await loadSituations();
    } catch (error: any) {
      message.error(`Falha ao salvar situação: ${error.message}`);
    }
  };

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
            <ExcelLikeTable tableId="orcamentos" rowKey="id" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
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
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input className="atlas-services-input" placeholder="Ex.: Empresa de Transportes Global" />
          </Form.Item>

          <Form.Item name="description" label="Descricao">
            <Input.TextArea className="atlas-services-input" rows={3} placeholder="Ex.: Renovacao anual do sistema de incendio e licenca" />
          </Form.Item>

          <Form.Item name="phone" label="Telefone" normalize={normalizePhoneBR} rules={[{ required: true, message: 'Informe o telefone' }]}>
            <Input className="prevent-services-input" />
          </Form.Item>
          <Form.Item name="serviceType" label="Tipo de servico" rules={[{ required: true, message: 'Selecione o tipo' }]}>
            <Select className="prevent-services-select" options={SERVICE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="situation" label="Situacao" rules={[{ required: true, message: 'Selecione a situacao' }]}>
            <Select
              className="atlas-services-select"
              placeholder="Selecione"
              options={situations.map((item) => ({ label: item.label, value: item.label }))}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ padding: 8 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="Adicionar nova situacao"
                          value={newSituationLabel}
                          onChange={(event) => setNewSituationLabel(event.target.value)}
                        />
                        <Button
                          type="primary"
                          onClick={async () => {
                            const label = newSituationLabel.trim();
                            if (!label) return;
                            try {
                              await cadastrosApi.createBudgetSituation({ label, closed: newSituationClosed });
                              setNewSituationLabel('');
                              setNewSituationClosed(false);
                              await loadSituations();
                              form.setFieldsValue({ situation: label });
                              message.success('Situacao adicionada.');
                            } catch (error: any) {
                              message.error(`Falha ao adicionar situacao: ${error.message}`);
                            }
                          }}
                        >
                          Adicionar
                        </Button>
                      </Space.Compact>
                      <Checkbox checked={newSituationClosed} onChange={(event) => setNewSituationClosed(event.target.checked)}>
                        Marcar como encerrada (Fechado)
                      </Checkbox>
                      <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => setManageSituationsOpen(true)}>
                        Gerenciar situações
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            />
          </Form.Item>
          <Form.Item name="totalValue" label="Valor total" rules={[{ required: true, message: 'Informe o valor total' }]}>
            <InputNumber className="prevent-services-number" style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} className="prevent-services-button prevent-services-button-primary">
            Salvar orcamento
          </Button>
        </Form>
      </Drawer>

      <Modal
        open={manageSituationsOpen}
        onCancel={() => {
          setManageSituationsOpen(false);
          setEditingSituation(null);
          situationForm.resetFields();
        }}
        footer={null}
        title="Situações de orçamento"
        width={820}
        className="atlas-services-modal"
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Card size="small" title={editingSituation ? 'Editar situação' : 'Nova situação'}>
            <Form
              form={situationForm}
              layout="vertical"
              initialValues={{ label: '', closed: false }}
              onFinish={() => void saveSituation()}
            >
              <Row gutter={12}>
                <Col span={16}>
                  <Form.Item name="label" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
                    <Input className="atlas-services-input" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="closed" valuePropName="checked" label=" ">
                    <Checkbox>Encerrada</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingSituation ? 'Salvar' : 'Criar'}
                </Button>
                {editingSituation ? (
                  <Button
                    onClick={() => {
                      setEditingSituation(null);
                      situationForm.resetFields();
                    }}
                  >
                    Cancelar edição
                  </Button>
                ) : null}
              </Space>
            </Form>
          </Card>

          <Table
            rowKey="id"
            dataSource={situations}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: 'Nome', dataIndex: 'label', key: 'label' },
              {
                title: 'Encerrada',
                dataIndex: 'closed',
                key: 'closed',
                width: 140,
                render: (value: boolean) => (value ? <Tag color="green">Sim</Tag> : <Tag>Não</Tag>),
              },
              {
                title: 'Ações',
                key: 'actions',
                width: 220,
                render: (_: unknown, record: BudgetSituationRecord) => (
                  <Space>
                    <Button onClick={() => openEditSituation(record)}>Editar</Button>
                    <Button
                      danger
                      onClick={() => Modal.confirm({
                        title: 'Excluir situação',
                        content: `Deseja excluir a situação "${record.label}"?`,
                        okText: 'Excluir',
                        okButtonProps: { danger: true },
                        cancelText: 'Cancelar',
                        onOk: async () => {
                          try {
                            await cadastrosApi.deleteBudgetSituation(record.id);
                            message.success('Situação excluída.');
                            if (editingSituation?.id === record.id) {
                              setEditingSituation(null);
                              situationForm.resetFields();
                            }
                            await loadSituations();
                          } catch (error: any) {
                            message.error(`Falha ao excluir: ${error.message}`);
                          }
                        },
                      })}
                    >
                      Excluir
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Modal>
    </div>
  );
};
