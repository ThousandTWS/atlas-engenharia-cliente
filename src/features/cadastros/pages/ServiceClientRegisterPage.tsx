/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FilePdfOutlined, HomeOutlined, PlusOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { clientesService } from '../../../core/services/clientesService';
import { servicesTrackingApi } from '../../services/servicesTrackingApi';
import { cadastrosApi, type BudgetRecord, type LinkedProviderRecord, type PaymentConditionRecord, type PaymentInstallment, type ProviderRecord, type ServiceKind, type ServiceRegistrationRecord, type SubtypeConfig } from '../cadastrosApi';
import { formatPhoneBR, normalizeCpfCnpjBR, normalizePhoneBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

const SERVICE_TYPE_OPTIONS = [
  { label: 'AVCB', value: 'AVCB' },
  { label: 'CLCB', value: 'CLCB' },
  { label: 'Obras', value: 'OBRAS' },
  { label: 'Proc. Adm.', value: 'PROCESSOS_ADM' },
] satisfies { label: string; value: ServiceKind }[];

const PAYMENT_METHOD_OPTIONS = ['Pix', 'Cartao', 'Asaas', 'Outro'].map((item) => ({ label: item, value: item }));
const SERVICE_TYPES: ServiceKind[] = ['AVCB', 'CLCB', 'OBRAS', 'PROCESSOS_ADM'];
const DEFAULT_INITIAL_SITUATIONS: Record<ServiceKind, string> = {
  AVCB: 'PENDENTE',
  CLCB: 'PENDENTE',
  OBRAS: 'ORCAMENTO',
  PROCESSOS_ADM: 'PENDENTE',
};
const EMPTY_SUBTYPE_CONFIG: SubtypeConfig = {
  AVCB: [],
  CLCB: [],
  OBRAS: [],
  PROCESSOS_ADM: [],
};

const buildInstallments = (count: number, totalValue: number): PaymentInstallment[] => {
  if (!count || count < 1) {
    return [];
  }

  const baseValue = Math.floor(((totalValue || 0) / count) * 100) / 100;
  const remainder = Number((totalValue - baseValue * count).toFixed(2));

  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    value: Number((baseValue + (index === count - 1 ? remainder : 0)).toFixed(2)),
    date: dayjs().add(index, 'month').format('YYYY-MM-DD'),
    method: 'Pix',
  }));
};

  const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export const ServiceClientRegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [services, setServices] = useState<ServiceRegistrationRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<PaymentConditionRecord[]>([]);
  const [subtypeConfig, setSubtypeConfig] = useState<SubtypeConfig>(EMPTY_SUBTYPE_CONFIG);
  const [initialSituations, setInitialSituations] = useState<Record<ServiceKind, string>>(DEFAULT_INITIAL_SITUATIONS);
  const [selectedBudget, setSelectedBudget] = useState<BudgetRecord | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<LinkedProviderRecord[]>([]);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [editingRecord, setEditingRecord] = useState<ServiceRegistrationRecord | null>(null);
  const [existingClientId, setExistingClientId] = useState<number | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [budgetSearch, setBudgetSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerForm] = Form.useForm();
  const [paymentConditionForm] = Form.useForm();

  const serviceType = Form.useWatch<ServiceKind>('serviceType', form) || 'AVCB';
  const contractValue = Number(Form.useWatch('contractValue', form) || 0);
  const sameAddress = Boolean(Form.useWatch('sameAddressAsCompany', form));
  const companyAddress = Form.useWatch<string>('companyAddress', form) || '';
  const paymentConditionId = Form.useWatch<number>('paymentConditionId', form);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [servicesResponse, budgetsResponse, providersResponse, conditionsResponse, subtypeResponse, situationResponses] = await Promise.all([
        cadastrosApi.getServices({ size: 500 }),
        cadastrosApi.getBudgets({ size: 500 }),
        cadastrosApi.getProviders({ size: 500 }),
        cadastrosApi.getPaymentConditions(),
        cadastrosApi.getSubtypeConfig(),
        Promise.all(SERVICE_TYPES.map(async (type) => ({
          type,
          items: await servicesTrackingApi.getSituations(type),
        }))),
      ]);

      setServices(servicesResponse.content);
      setBudgets(budgetsResponse.content);
      setProviders(providersResponse.content);
      setPaymentConditions(conditionsResponse);
      setSubtypeConfig(subtypeResponse);
      setInitialSituations(situationResponses.reduce<Record<ServiceKind, string>>((acc, entry) => ({
        ...acc,
        [entry.type]: entry.items.find((item) => item.isDefault)?.label || DEFAULT_INITIAL_SITUATIONS[entry.type],
      }), DEFAULT_INITIAL_SITUATIONS));
    } catch (error: any) {
      message.error(`Erro ao carregar cadastros: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!form.getFieldValue('entryDate')) {
      form.setFieldsValue({
        serviceType: 'AVCB',
        entryDate: dayjs().format('YYYY-MM-DD'),
        contractDate: dayjs().format('YYYY-MM-DD'),
        initialSituation: initialSituations.AVCB,
        sameAddressAsCompany: true,
      });
    }
  }, [form, initialSituations]);

  useEffect(() => {
    if (!editingRecord) {
      form.setFieldValue('initialSituation', initialSituations[serviceType]);
    }
  }, [editingRecord, form, initialSituations, serviceType]);

  useEffect(() => {
    const currentSubtype = form.getFieldValue('subtype');
    if (currentSubtype && !(subtypeConfig[serviceType] || []).includes(currentSubtype)) {
      form.setFieldValue('subtype', undefined);
    }
  }, [form, serviceType, subtypeConfig]);

  useEffect(() => {
    if (sameAddress) {
      form.setFieldValue('serviceAddress', companyAddress);
    }
  }, [companyAddress, form, sameAddress]);

  useEffect(() => {
    const selected = paymentConditions.find((item) => item.id === paymentConditionId);
    if (selected && contractValue > 0 && !editingRecord) {
      setInstallments(buildInstallments(selected.installments, contractValue));
      form.setFieldValue('paymentConditionLabel', selected.label);
    }
  }, [contractValue, editingRecord, form, paymentConditionId, paymentConditions]);

  const paymentTotal = useMemo(() => installments.reduce((acc, item) => acc + Number(item.value || 0), 0), [installments]);
  const paymentMismatch = Number(paymentTotal.toFixed(2)) !== Number(contractValue.toFixed(2));

  const filteredBudgets = useMemo(() => budgets.filter((item) => {
    const haystack = [item.code, item.phone, item.serviceType, item.totalValue, item.createdAt].join(' ').toLowerCase();
    return haystack.includes(budgetSearch.toLowerCase());
  }), [budgetSearch, budgets]);

  const recentServicesColumns: ColumnsType<ServiceRegistrationRecord> = [
    { title: 'Codigo', dataIndex: 'code', key: 'code', render: (value) => <Text strong>{value}</Text> },
    { title: 'Cliente', dataIndex: 'companyName', key: 'companyName' },
    { title: 'Tipo', dataIndex: 'serviceType', key: 'serviceType' },
    { title: 'Subtipo', dataIndex: 'subtype', key: 'subtype' },
    { title: 'Valor', dataIndex: 'contractValue', key: 'contractValue', render: (value) => formatCurrency(value) },
    { title: 'Acoes', key: 'actions', render: (_, record) => <Button onClick={() => loadRecord(record)}>Editar</Button> },
  ];

  const resetForm = () => {
    setEditingRecord(null);
    setExistingClientId(null);
    setSelectedBudget(null);
    setLinkedProviders([]);
    setInstallments([]);
    form.resetFields();
    form.setFieldsValue({
      serviceType: 'AVCB',
      entryDate: dayjs().format('YYYY-MM-DD'),
      contractDate: dayjs().format('YYYY-MM-DD'),
      initialSituation: initialSituations.AVCB,
      sameAddressAsCompany: true,
    });
  };

  const loadRecord = (record: ServiceRegistrationRecord) => {
    setEditingRecord(record);
    setExistingClientId(record.clientId || null);
    setSelectedBudget(record.linkedBudgetId ? budgets.find((item) => item.id === record.linkedBudgetId) || null : null);
    setLinkedProviders(record.providers || []);
    setInstallments(record.installments || []);
    form.setFieldsValue(record);
  };

  const saveInlineProvider = async (provider: Partial<ProviderRecord>) => {
    try {
      const saved = await cadastrosApi.saveProvider(provider);
      await loadAll();
      providerForm.resetFields();
      setProviderDrawerOpen(false);
      message.success('Prestador salvo para uso imediato.');
      return saved;
    } catch (error: any) {
      message.error(error.message);
      return null;
    }
  };

  const handleClientLookup = async () => {
    const document = String(form.getFieldValue('companyDocument') || '').trim();
    if (!document) {
      return;
    }

    try {
      const response = await clientesService.getAll({ cnpjCpf: document, size: 20 });
      const match = response.content.find((item) => item.cnpjCpf?.replace(/\D/g, '') === document.replace(/\D/g, ''));
      if (!match) {
        setExistingClientId(null);
        message.info('Cliente nao encontrado na base. Voce pode cadastrar normalmente.');
        return;
      }

      setExistingClientId(match.id || null);
      const address = [match.rua, match.numero, match.bairro, match.cidade, match.estado, match.cep].filter(Boolean).join(', ');
      form.setFieldsValue({
        companyName: match.razaoSocial,
        contactName: match.nomeContato,
        phone: formatPhoneBR(match.telefone || ''),
        email: match.email,
        companyAddress: address,
        serviceAddress: form.getFieldValue('sameAddressAsCompany') ? address : form.getFieldValue('serviceAddress'),
      });
      message.success('Dados do cliente carregados automaticamente.');
    } catch (error: any) {
      message.error(`Erro ao buscar cliente: ${error.message}`);
    }
  };

  const syncClientRecord = async (values: any) => {
    const [rua = '', numero = '', bairro = '', cidade = '', estado = '', cep = ''] = String(values.companyAddress || '').split(',').map((part: string) => part.trim());
    const payload = {
      cnpjCpf: values.companyDocument,
      razaoSocial: values.companyName,
      nomeContato: values.contactName,
      telefone: values.phone,
      email: values.email,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      complemento: '',
    };

    if (existingClientId) {
      await clientesService.update(existingClientId, payload);
      return existingClientId;
    }

    const created = await clientesService.create(payload);
    const clientId = created.id || null;
    setExistingClientId(clientId);
    return clientId;
  };

  const handleSave = async (values: any) => {
    if (paymentMismatch) {
      message.error('A soma das parcelas precisa fechar exatamente o valor total do contrato.');
      return;
    }

    try {
      const clientId = await syncClientRecord(values);

      const saved = await cadastrosApi.saveService({
        id: editingRecord?.id || 0,
        code: editingRecord?.code || '',
        clientId,
        serviceType: values.serviceType,
        subtype: values.subtype,
        linkedBudgetId: selectedBudget?.id,
        linkedBudgetCode: selectedBudget?.code,
        entryDate: values.entryDate,
        initialSituation: values.initialSituation,
        companyDocument: values.companyDocument,
        companyName: values.companyName,
        contactName: values.contactName,
        phone: values.phone,
        email: values.email,
        companyAddress: values.companyAddress,
        serviceAddress: values.serviceAddress,
        sameAddressAsCompany: Boolean(values.sameAddressAsCompany),
        contractValue: Number(values.contractValue || 0),
        contractDate: values.contractDate,
        paymentConditionId: values.paymentConditionId,
        paymentConditionLabel: values.paymentConditionLabel,
        installments,
        invoiceValue: Number(values.invoiceValue || 0),
        providers: linkedProviders,
        createdAt: editingRecord?.createdAt || '',
      });

      await loadAll();
      message.success(editingRecord ? 'Servico atualizado.' : `Servico cadastrado com codigo ${saved.code}.`);
      loadRecord(saved);
    } catch (error: any) {
      message.error(error.message || 'Erro ao salvar cadastro.');
    }
  };

  const exportPurchaseOrderPdf = () => {
    const values = form.getFieldsValue(true);
    const code = editingRecord?.code || servicePreviewCode;
    const nowLabel = dayjs().format('DD/MM/YYYY HH:mm');

    const paymentConditionLabel = values.paymentConditionLabel || paymentConditions.find((item) => item.id === values.paymentConditionId)?.label || '-';

    const providersRows = (linkedProviders || [])
      .map((provider) => `
        <tr>
          <td>${provider.providerName || '-'}</td>
          <td style="text-align:right">${formatCurrency(Number(provider.provisionedValue || 0))}</td>
          <td style="text-align:right">${formatCurrency(Number(provider.effectiveValue || 0))}</td>
          <td style="text-align:center">${provider.confirmed ? 'Sim' : 'Nao'}</td>
        </tr>
      `)
      .join('');

    const installmentsRows = (installments || [])
      .map((installment) => `
        <tr>
          <td style="text-align:center">${installment.number}</td>
          <td style="text-align:right">${formatCurrency(Number(installment.value || 0))}</td>
          <td style="text-align:center">${installment.date ? dayjs(installment.date).format('DD/MM/YYYY') : '-'}</td>
          <td style="text-align:center">${installment.method || '-'}</td>
        </tr>
      `)
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      message.error('O navegador bloqueou a abertura da janela de impressao.');
      return;
    }

    printWindow.document.write(`
      <html lang="pt-BR">
        <head>
          <title>Pedido de Compra ${code}</title>
          <style>
            body { font-family: "Segoe UI", sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 4px; }
            p { margin: 0 0 18px; color: #475569; }
            h2 { margin: 20px 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td, th { border: 1px solid #dbe7f6; padding: 10px 12px; font-size: 13px; }
            th { background: #f8fbff; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Pedido de Compra</h1>
          <p>${code} • Gerado em ${nowLabel}</p>

          <h2>Cliente e Servico</h2>
          <table>
            <tr><th style="width: 240px">Documento</th><td>${values.companyDocument || '-'}</td></tr>
            <tr><th>Razao social</th><td>${values.companyName || '-'}</td></tr>
            <tr><th>Contato</th><td>${values.contactName || '-'}</td></tr>
            <tr><th>Telefone</th><td>${values.phone || '-'}</td></tr>
            <tr><th>E-mail</th><td>${values.email || '-'}</td></tr>
            <tr><th>Endereco da empresa</th><td>${values.companyAddress || '-'}</td></tr>
            <tr><th>Local do servico</th><td>${values.serviceAddress || '-'}</td></tr>
            <tr><th>Tipo</th><td>${values.serviceType || '-'}</td></tr>
            <tr><th>Subtipo</th><td>${values.subtype || '-'}</td></tr>
          </table>

          <h2>Financeiro</h2>
          <table>
            <tr><th style="width: 240px">Valor do contrato</th><td>${formatCurrency(Number(values.contractValue || 0))}</td></tr>
            <tr><th>Data do contrato</th><td>${values.contractDate ? dayjs(values.contractDate).format('DD/MM/YYYY') : '-'}</td></tr>
            <tr><th>Desconto NF</th><td>${formatCurrency(Number(values.invoiceValue || 0))}</td></tr>
            <tr><th>Condicao de pagamento</th><td>${paymentConditionLabel}</td></tr>
          </table>

          <h2>Parcelas</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 90px; text-align:center">#</th>
                <th style="text-align:right">Valor</th>
                <th style="width: 140px; text-align:center">Vencimento</th>
                <th style="width: 140px; text-align:center">Forma</th>
              </tr>
            </thead>
            <tbody>
              ${installmentsRows || '<tr><td colspan="4">Sem parcelas</td></tr>'}
            </tbody>
          </table>

          <h2>Prestadores</h2>
          <table>
            <thead>
              <tr>
                <th>Prestador</th>
                <th style="text-align:right">Provisionado</th>
                <th style="text-align:right">Efetivo</th>
                <th style="text-align:center; width: 110px">Confirmado</th>
              </tr>
            </thead>
            <tbody>
              ${providersRows || '<tr><td colspan="4">Sem prestadores vinculados</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const createPaymentCondition = async (values: { label: string; installments: number }) => {
    try {
      const created = await cadastrosApi.savePaymentCondition(values);
      const conditions = await cadastrosApi.getPaymentConditions();
      setPaymentConditions(conditions);
      form.setFieldsValue({
        paymentConditionId: created.id,
        paymentConditionLabel: created.label,
      });
      setInstallments(buildInstallments(created.installments, contractValue));
      paymentConditionForm.resetFields();
      setPaymentModalOpen(false);
      message.success('Condicao de pagamento criada.');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const servicePreviewCode = useMemo(() => {
    if (editingRecord?.code) {
      return editingRecord.code;
    }
    const totalByType = services.filter((item) => item.serviceType === serviceType).length;
    return `S-${serviceType}-${String(totalByType + 1).padStart(4, '0')}`;
  }, [editingRecord?.code, serviceType, services]);

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Cadastros', href: '/cadastros' },
          { title: 'Servico e Cliente' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Space direction="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>Cadastro Unico de Servico / Cliente</Title>
          <Text type="secondary">Tudo em uma unica tela com financeiro, parcelas, orcamento e prestadores.</Text>
        </Space>
        <Space wrap>
          <Tag className="atlas-dashboard-meta-chip" bordered={false}>Codigo previsto {servicePreviewCode}</Tag>
          <Button onClick={resetForm}>Novo cadastro</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Tabs
          items={[
            {
              key: 'cliente-servico',
              label: 'Cliente + Servico',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={10}>
                    <Card className="atlas-services-table-card" title="Dados do cliente" loading={loading}>
                      <Form.Item name="companyDocument" label="CPF ou CNPJ" normalize={normalizeCpfCnpjBR} rules={[{ required: true, message: 'Informe o documento' }]}>
                        <Input
                          className="atlas-services-input"
                          addonAfter={<SearchOutlined onClick={() => void handleClientLookup()} />}
                          onBlur={() => void handleClientLookup()}
                        />
                      </Form.Item>
                      <Form.Item name="companyName" label="Razao social" rules={[{ required: true, message: 'Informe a razao social' }]}>
                        <Input className="atlas-services-input" />
                      </Form.Item>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item name="contactName" label="Contato">
                            <Input className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="phone" label="Telefone" normalize={normalizePhoneBR}>
                            <Input className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item name="email" label="E-mail">
                        <Input className="atlas-services-input" />
                      </Form.Item>
                      <Form.Item name="companyAddress" label="Endereco da empresa">
                        <Input.TextArea className="atlas-services-input" rows={3} />
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={14}>
                    <Card className="atlas-services-table-card" title="Dados do servico" loading={loading}>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item name="serviceType" label="Tipo" rules={[{ required: true, message: 'Selecione o tipo' }]}>
                            <Select className="atlas-services-select" options={SERVICE_TYPE_OPTIONS} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="subtype" label="Subtipo" rules={[{ required: true, message: 'Informe o subtipo' }]}>
                            <Select
                              className="atlas-services-select"
                              options={(subtypeConfig[serviceType] || []).map((item) => ({ label: item, value: item }))}
                              showSearch
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="Codigo gerado">
                            <Input className="atlas-services-input" value={servicePreviewCode} disabled />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item name="entryDate" label="Data de entrada" rules={[{ required: true, message: 'Informe a data de entrada' }]}>
                            <Input type="date" className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="initialSituation" label="Situacao inicial">
                            <Input className="atlas-services-input" disabled />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Space style={{ marginBottom: 12 }}>
                        <Button onClick={() => setBudgetModalOpen(true)}>Vincular orcamento</Button>
                        {selectedBudget ? <Tag color="blue">{selectedBudget.code}</Tag> : <Text type="secondary">Nenhum orcamento vinculado</Text>}
                      </Space>

                      <Form.Item name="sameAddressAsCompany" valuePropName="checked">
                        <Checkbox>Mesmo endereco da empresa</Checkbox>
                      </Form.Item>

                      <Form.Item name="serviceAddress" label="Local do servico">
                        <Input.TextArea className="atlas-services-input" rows={3} />
                      </Form.Item>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'financeiro',
              label: 'Financeiro',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={10}>
                    <Card className="atlas-services-table-card" title="Resumo financeiro">
                      <Form.Item name="contractValue" label="Valor total do contrato" rules={[{ required: true, message: 'Informe o valor do contrato' }]}>
                        <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item name="contractDate" label="Data do contrato" rules={[{ required: true, message: 'Informe a data do contrato' }]}>
                        <Input type="date" className="atlas-services-input" />
                      </Form.Item>
                      <Form.Item name="invoiceValue" label="Desconto NF (opcional)">
                        <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item name="paymentConditionId" label="Condicao de pagamento" rules={[{ required: true, message: 'Selecione uma condicao' }]}>
                        <Select
                          className="atlas-services-select"
                          options={paymentConditions.map((item) => ({ label: item.label, value: item.id }))}
                          dropdownRender={(menu) => (
                            <>
                              {menu}
                              <div style={{ padding: 8 }}>
                                <Button type="link" icon={<PlusOutlined />} onClick={() => setPaymentModalOpen(true)}>
                                  Criar nova condicao
                                </Button>
                              </div>
                            </>
                          )}
                        />
                      </Form.Item>
                    </Card>
                  </Col>
                  <Col xs={24} lg={14}>
                    <Card className="atlas-services-table-card" title="Parcelas" extra={paymentMismatch ? <Tag color="red">Soma divergente</Tag> : <Tag color="green">Soma conferida</Tag>}>
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        {installments.map((item, index) => (
                          <Row key={`${item.id || item.number}-${index}`} gutter={10}>
                            <Col xs={24} md={4}>
                              <Input className="atlas-services-input" value={`Parcela ${item.number}`} disabled />
                            </Col>
                            <Col xs={24} md={6}>
                              <InputNumber
                                className="atlas-services-number"
                                style={{ width: '100%' }}
                                min={0}
                                value={item.value}
                                onChange={(value) => setInstallments((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, value: Number(value || 0) } : currentItem))}
                              />
                            </Col>
                            <Col xs={24} md={7}>
                              <Input
                                type="date"
                                className="atlas-services-input"
                                value={item.date}
                                onChange={(event) => setInstallments((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, date: event.target.value } : currentItem))}
                              />
                            </Col>
                            <Col xs={24} md={7}>
                              <Select
                                className="atlas-services-select"
                                options={PAYMENT_METHOD_OPTIONS}
                                value={item.method}
                                onChange={(value) => setInstallments((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, method: value } : currentItem))}
                              />
                            </Col>
                          </Row>
                        ))}
                        <Text type={paymentMismatch ? 'danger' : 'secondary'}>
                          Soma das parcelas: {formatCurrency(paymentTotal)} | Valor do contrato: {formatCurrency(contractValue)}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'prestadores',
              label: 'Prestadores / Custos',
              children: (
                <Card className="atlas-services-table-card" title="Prestadores vinculados" extra={<Button icon={<PlusOutlined />} onClick={() => setProviderDrawerOpen(true)}>Novo prestador</Button>}>
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={8}>
                      <Select
                        className="atlas-services-select"
                        placeholder="Selecionar prestador existente"
                        options={providers.map((item) => ({ label: item.name || item.document || String(item.id), value: item.id }))}
                        onChange={(value) => {
                          const provider = providers.find((item) => item.id === value);
                          if (!provider) {
                            return;
                          }
                          if (linkedProviders.some((item) => item.providerId === provider.id)) {
                            message.info('Prestador ja vinculado.');
                            return;
                          }
                          setLinkedProviders((current) => [
                            ...current,
                            {
                              providerId: provider.id,
                              providerName: provider.name || provider.document,
                              provisionedValue: 0,
                            },
                          ]);
                        }}
                      />
                    </Col>
                  </Row>

                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {linkedProviders.map((item, index) => (
                      <Row key={`${item.providerId || item.providerName}-${index}`} gutter={10}>
                        <Col xs={24} md={8}>
                          <Input className="atlas-services-input" value={item.providerName} disabled />
                        </Col>
                        <Col xs={24} md={5}>
                          <InputNumber
                            className="atlas-services-number"
                            style={{ width: '100%' }}
                            min={0}
                            value={item.provisionedValue}
                            onChange={(value) => setLinkedProviders((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, provisionedValue: Number(value || 0) } : currentItem))}
                          />
                        </Col>
                        <Col xs={24} md={5}>
                          <InputNumber
                            className="atlas-services-number"
                            style={{ width: '100%' }}
                            min={0}
                            value={item.effectiveValue}
                            onChange={(value) => setLinkedProviders((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, effectiveValue: Number(value || 0) } : currentItem))}
                          />
                        </Col>
                        <Col xs={24} md={4}>
                          <Checkbox
                            checked={Boolean(item.confirmed)}
                            onChange={(event) => setLinkedProviders((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, confirmed: event.target.checked } : currentItem))}
                          >
                            Confirmado
                          </Checkbox>
                        </Col>
                        <Col xs={24} md={2}>
                          <Button danger onClick={() => setLinkedProviders((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                            Remover
                          </Button>
                        </Col>
                      </Row>
                    ))}
                  </Space>
                </Card>
              ),
            },
          ]}
        />

        <Space style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} className="atlas-services-button atlas-services-button-primary">
            Salvar cadastro
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            className="atlas-services-button"
            disabled={!editingRecord?.id}
            onClick={exportPurchaseOrderPdf}
          >
            Pedido de compra (PDF)
          </Button>
          {paymentMismatch ? <Tag color="red">Nao e possivel salvar com parcelas divergentes</Tag> : null}
        </Space>
      </Form>

      <Card className="atlas-services-table-card" style={{ marginTop: 24 }} title="Cadastros recentes" loading={loading}>
        <Table rowKey="id" columns={recentServicesColumns} dataSource={services} pagination={{ pageSize: 6 }} />
      </Card>

      <Modal
        open={budgetModalOpen}
        onCancel={() => setBudgetModalOpen(false)}
        footer={null}
        width={860}
        title="Selecionar orcamento existente"
        className="atlas-services-modal"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            className="atlas-services-input"
            placeholder="Filtrar por codigo, valor, tipo ou data"
            value={budgetSearch}
            onChange={(event) => setBudgetSearch(event.target.value)}
          />
          <Table
            rowKey="id"
            dataSource={filteredBudgets}
            pagination={{ pageSize: 5 }}
            columns={[
              { title: 'Codigo', dataIndex: 'code', key: 'code' },
              { title: 'Tipo', dataIndex: 'serviceType', key: 'serviceType' },
              { title: 'Valor', dataIndex: 'totalValue', key: 'totalValue', render: (value) => formatCurrency(value) },
              { title: 'Data', dataIndex: 'createdAt', key: 'createdAt', render: (value) => dayjs(value).format('DD/MM/YYYY') },
              {
                title: 'Vincular',
                key: 'actions',
                render: (_, record: BudgetRecord) => (
                  <Button
                    type="primary"
                    onClick={() => {
                      setSelectedBudget(record);
                      form.setFieldsValue({
                        serviceType: record.serviceType,
                        contractValue: record.totalValue,
                      });
                      setBudgetModalOpen(false);
                    }}
                  >
                    Usar
                  </Button>
                ),
              },
            ]}
          />
        </Space>
      </Modal>

      <Drawer
        open={providerDrawerOpen}
        onClose={() => setProviderDrawerOpen(false)}
        width={520}
        title="Novo prestador"
        className="atlas-services-drawer"
      >
        <Form form={providerForm} layout="vertical" onFinish={saveInlineProvider}>
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
          <Form.Item name="paymentMethod" label="Metodo">
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

      <Modal
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={null}
        title="Nova condicao de pagamento"
        className="atlas-services-modal"
      >
        <Form form={paymentConditionForm} layout="vertical" onFinish={createPaymentCondition}>
          <Form.Item name="label" label="Nome da condicao" rules={[{ required: true, message: 'Informe a condicao' }]}>
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="installments" label="Quantidade de parcelas" rules={[{ required: true, message: 'Informe a quantidade' }]}>
            <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<PlusOutlined />} className="atlas-services-button atlas-services-button-primary">
            Criar condicao
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
