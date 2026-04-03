/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useSearchParams } from 'react-router-dom';
import { clientesService } from '../../../core/services/clientesService';
import { cepService } from '../../../core/services/cepService';
import { pdfTemplatesService } from '../../../core/services/pdfTemplatesService';
import { servicesTrackingApi } from '../../services/servicesTrackingApi';
import { cadastrosApi, type BudgetRecord, type LinkedProviderRecord, type PaymentConditionRecord, type PaymentInstallment, type ProviderRecord, type ServiceKind, type ServiceRegistrationRecord, type SubtypeConfig } from '../cadastrosApi';
import { formatPhoneBR, normalizeCepBR, normalizeCpfCnpjBR, normalizePhoneBR } from '../../../shared/utils/inputFormat';
import { renderPdfTemplate, toSafeTextVar } from '../../../shared/utils/pdfTemplate';
import { PdfTemplateEditorModal } from '../../../shared/components/PdfTemplateEditorModal';

const { Title, Text } = Typography;

const SERVICE_TYPE_OPTIONS = [
  { label: 'AVCB', value: 'AVCB' },
  { label: 'CLCB', value: 'CLCB' },
  { label: 'Obras', value: 'OBRAS' },
  { label: 'Proc. Adm.', value: 'PROCESSOS_ADM' },
] satisfies { label: string; value: ServiceKind }[];

const PAYMENT_METHOD_OPTIONS = ['Pix', 'Cartao', 'Asaas', 'Outro'].map((item) => ({ label: item, value: item }));
const PROVIDER_PAYMENT_DATE_TYPE_OPTIONS = [
  { label: 'A definir', value: 'A_DEFINIR' },
  { label: 'No término do serviço', value: 'TERMINO_SERVICO' },
  { label: 'Data específica', value: 'DATA' },
] as const;
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

type DiscountRule = 'FIRST' | 'ALL' | 'SPECIFIC';

const buildInstallments = (
  count: number,
  totalValue: number,
  options?: { startDate?: string; intervalDays?: number | null; method?: string },
): PaymentInstallment[] => {
  if (!count || count < 1) {
    return [];
  }

  const baseValue = Math.floor(((totalValue || 0) / count) * 100) / 100;
  const remainder = Number((totalValue - baseValue * count).toFixed(2));
  const startDate = options?.startDate || dayjs().format('YYYY-MM-DD');
  const intervalDays = options?.intervalDays;
  const method = options?.method || 'Pix';

  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    value: Number((baseValue + (index === count - 1 ? remainder : 0)).toFixed(2)),
    date: intervalDays == null
      ? dayjs(startDate).add(index, 'month').format('YYYY-MM-DD')
      : dayjs(startDate).add(index * intervalDays, 'day').format('YYYY-MM-DD'),
    method,
  }));
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const parseCurrencyInput = (value?: string) => {
  const normalized = String(value || '')
    .replace(/\s/g, '')
    .replace(/[R$]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrencyInput = (value?: string | number) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const numeric = typeof value === 'number' ? value : parseCurrencyInput(String(value));
  return formatCurrency(numeric);
};

const applyDiscount = (
  gross: PaymentInstallment[],
  discount: number,
  rule: DiscountRule,
  specificNumbers: number[],
): PaymentInstallment[] => {
  const askedDiscount = Number(discount || 0);
  const grossTotal = Number(gross.reduce((acc, item) => acc + Number(item.value || 0), 0).toFixed(2));
  const totalDiscount = Math.min(Number(askedDiscount.toFixed(2)), grossTotal);
  if (!gross.length || totalDiscount <= 0) {
    return gross;
  }

  const values = gross.map((item) => Number(item.value || 0));
  const indices = (() => {
    if (rule === 'ALL') return values.map((_, idx) => idx);
    if (rule === 'SPECIFIC') {
      const set = new Set((specificNumbers || []).map((n) => Number(n) - 1).filter((idx) => idx >= 0 && idx < values.length));
      return Array.from(set).sort((a, b) => a - b);
    }
    return values.map((_, idx) => idx); // FIRST: aplica do 1º em diante até consumir o desconto
  })();

  let remaining = Number(totalDiscount.toFixed(2));
  for (const idx of indices) {
    if (remaining <= 0) break;
    const available = Number(values[idx].toFixed(2));
    const applied = Math.min(available, remaining);
    values[idx] = Number((available - applied).toFixed(2));
    remaining = Number((remaining - applied).toFixed(2));
  }

  const updated = gross.map((item, idx) => ({ ...item, value: Number(values[idx].toFixed(2)) }));
  const total = updated.reduce((acc, item) => acc + Number(item.value || 0), 0);
  const expected = Number((grossTotal - totalDiscount).toFixed(2));
  const diff = Number((expected - Number(total.toFixed(2))).toFixed(2));
  if (Math.abs(diff) >= 0.01 && updated.length) {
    const lastIndex = updated.length - 1;
    updated[lastIndex] = { ...updated[lastIndex], value: Number((updated[lastIndex].value + diff).toFixed(2)) };
  }

  return updated;
};

const buildAddressString = (parts: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}) => ([
  parts.street,
  parts.number,
  parts.neighborhood,
  parts.city,
  parts.state,
  parts.cep,
].map((item) => String(item || '').trim()).filter(Boolean)).join(', ');

export const ServiceClientRegisterPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
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
  const [paymentManageOpen, setPaymentManageOpen] = useState(false);
  const [editingPaymentCondition, setEditingPaymentCondition] = useState<PaymentConditionRecord | null>(null);
  const [budgetSearch, setBudgetSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerForm] = Form.useForm();
  const [paymentConditionForm] = Form.useForm();
  const paymentConditionIndefinido = Boolean(Form.useWatch('isUndefined', paymentConditionForm));

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateHtml, setTemplateHtml] = useState('');
  const [templateName, setTemplateName] = useState('');

  const serviceType = Form.useWatch<ServiceKind>('serviceType', form) || 'AVCB';
  const contractValue = Number(Form.useWatch('contractValue', form) || 0);
  const invoiceValue = Number(Form.useWatch('invoiceValue', form) || 0);
  const contractDate = Form.useWatch<string>('contractDate', form) || '';
  const sameAddress = Boolean(Form.useWatch('sameAddressAsCompany', form));
  const paymentConditionId = Form.useWatch<number>('paymentConditionId', form);

  const companyCep = Form.useWatch<string>('companyCep', form) || '';
  const companyStreet = Form.useWatch<string>('companyStreet', form) || '';
  const companyNumber = Form.useWatch<string>('companyNumber', form) || '';
  const companyNeighborhood = Form.useWatch<string>('companyNeighborhood', form) || '';
  const companyCity = Form.useWatch<string>('companyCity', form) || '';
  const companyState = Form.useWatch<string>('companyState', form) || '';

  const serviceCep = Form.useWatch<string>('serviceCep', form) || '';
  const serviceStreet = Form.useWatch<string>('serviceStreet', form) || '';
  const serviceNumber = Form.useWatch<string>('serviceNumber', form) || '';
  const serviceNeighborhood = Form.useWatch<string>('serviceNeighborhood', form) || '';
  const serviceCity = Form.useWatch<string>('serviceCity', form) || '';
  const serviceState = Form.useWatch<string>('serviceState', form) || '';

  const companyAddressString = useMemo(() => buildAddressString({
    street: companyStreet,
    number: companyNumber,
    neighborhood: companyNeighborhood,
    city: companyCity,
    state: companyState,
    cep: companyCep,
  }), [companyCep, companyCity, companyNeighborhood, companyNumber, companyState, companyStreet]);

  const serviceAddressString = useMemo(() => buildAddressString({
    street: serviceStreet,
    number: serviceNumber,
    neighborhood: serviceNeighborhood,
    city: serviceCity,
    state: serviceState,
    cep: serviceCep,
  }), [serviceCep, serviceCity, serviceNeighborhood, serviceNumber, serviceState, serviceStreet]);

  const [discountRule, setDiscountRule] = useState<DiscountRule>('FIRST');
  const [discountSpecific, setDiscountSpecific] = useState<number[]>([1]);
  const [propagateMethodToAll, setPropagateMethodToAll] = useState(false);
  const [recalcDatesFromFirst, setRecalcDatesFromFirst] = useState(true);

  const selectedPaymentCondition = useMemo(
    () => paymentConditions.find((item) => item.id === paymentConditionId) || null,
    [paymentConditionId, paymentConditions],
  );

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
      const queryType = searchParams.get('tipo') as ServiceKind | null;
      const resolvedType: ServiceKind = queryType && SERVICE_TYPES.includes(queryType) ? queryType : 'AVCB';
      form.setFieldsValue({
        serviceType: resolvedType,
        entryDate: dayjs().format('YYYY-MM-DD'),
        contractDate: dayjs().format('YYYY-MM-DD'),
        initialSituation: initialSituations[resolvedType] ?? initialSituations.AVCB,
        sameAddressAsCompany: true,
      });
    }
  }, [form, initialSituations, searchParams]);

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
    form.setFieldValue('companyAddress', companyAddressString);
  }, [companyAddressString, form]);

  useEffect(() => {
    if (sameAddress) {
      form.setFieldsValue({
        serviceCep: companyCep,
        serviceStreet: companyStreet,
        serviceNumber: companyNumber,
        serviceNeighborhood: companyNeighborhood,
        serviceCity: companyCity,
        serviceState: companyState,
      });
      form.setFieldValue('serviceAddress', companyAddressString);
      return;
    }
    form.setFieldValue('serviceAddress', serviceAddressString);
  }, [companyAddressString, companyCep, companyCity, companyNeighborhood, companyNumber, companyState, companyStreet, form, sameAddress, serviceAddressString]);

  const recalculateInstallments = (options?: { rebuildDates?: boolean }) => {
    if (!selectedPaymentCondition || contractValue <= 0) {
      if (!editingRecord) {
        setInstallments([]);
      }
      return;
    }

    const rebuildDates = Boolean(options?.rebuildDates);
    const count = selectedPaymentCondition.installments;
    const intervalDays = selectedPaymentCondition.isUndefined ? null : (selectedPaymentCondition.intervalDays ?? 30);
    const current = installments;
    const startDate = rebuildDates
      ? (contractDate || current[0]?.date || dayjs().format('YYYY-MM-DD'))
      : (current[0]?.date || contractDate || dayjs().format('YYYY-MM-DD'));

    const base = buildInstallments(count, contractValue, {
      startDate,
      intervalDays: rebuildDates ? intervalDays : null,
      method: current[0]?.method || 'Pix',
    });

    const merged = base.map((item, index) => ({
      ...item,
      date: rebuildDates ? item.date : (current[index]?.date || item.date),
      method: current[index]?.method || item.method,
    }));

    const discounted = applyDiscount(merged, invoiceValue, discountRule, discountSpecific);
    setInstallments(discounted);
    form.setFieldValue('paymentConditionLabel', selectedPaymentCondition.label);
  };

  useEffect(() => {
    if (editingRecord) {
      return;
    }
    if (!selectedPaymentCondition) {
      setInstallments([]);
      return;
    }
    recalculateInstallments({ rebuildDates: true });
  }, [contractValue, contractDate, editingRecord, selectedPaymentCondition]);

  useEffect(() => {
    if (editingRecord) {
      return;
    }
    if (!selectedPaymentCondition) {
      return;
    }
    if (!installments.length) {
      return;
    }
    recalculateInstallments({ rebuildDates: false });
  }, [discountRule, discountSpecific, editingRecord, invoiceValue]);

  const paymentTotal = useMemo(() => installments.reduce((acc, item) => acc + Number(item.value || 0), 0), [installments]);
  const netTotal = useMemo(() => Math.max(Number((contractValue - invoiceValue).toFixed(2)), 0), [contractValue, invoiceValue]);
  const paymentMismatch = Number(paymentTotal.toFixed(2)) !== Number(netTotal.toFixed(2));

  const filteredBudgets = useMemo(() => budgets.filter((item) => {
    const phoneDigits = String(item.phone || '').replace(/\D/g, '');
    const haystack = [item.code, item.phone, phoneDigits, item.serviceType, item.totalValue, item.createdAt].join(' ').toLowerCase();
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
    setDiscountRule('FIRST');
    setDiscountSpecific([1]);
    setPropagateMethodToAll(false);
    setRecalcDatesFromFirst(true);
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

    const [rua = '', numero = '', bairro = '', cidade = '', estado = '', cep = ''] = String(record.companyAddress || '').split(',').map((part: string) => part.trim());
    const [sRua = '', sNumero = '', sBairro = '', sCidade = '', sEstado = '', sCep = ''] = String(record.serviceAddress || '').split(',').map((part: string) => part.trim());
    form.setFieldsValue({
      companyStreet: rua,
      companyNumber: numero,
      companyNeighborhood: bairro,
      companyCity: cidade,
      companyState: estado,
      companyCep: cep,
      serviceStreet: sRua,
      serviceNumber: sNumero,
      serviceNeighborhood: sBairro,
      serviceCity: sCidade,
      serviceState: sEstado,
      serviceCep: sCep,
    });
  };

  const lastAutoLoadCodeRef = useRef<string>('');

  useEffect(() => {
    const codigo = String(searchParams.get('codigo') || '').trim();
    if (!codigo) {
      lastAutoLoadCodeRef.current = '';
      return;
    }

    if (lastAutoLoadCodeRef.current.toLowerCase() === codigo.toLowerCase()) {
      return;
    }

    lastAutoLoadCodeRef.current = codigo;

    const run = async () => {
      try {
        setLoading(true);
        const response = await cadastrosApi.getServices({ codigo, size: 5 });
        const match = response.content.find((item) => item.code?.toLowerCase() === codigo.toLowerCase()) || response.content[0];
        if (!match) {
          message.warning(`Cadastro não encontrado para o código ${codigo}.`);
          return;
        }
        loadRecord(match);
      } catch (error: any) {
        message.error(`Falha ao abrir cadastro: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      form.setFieldsValue({
        companyName: match.razaoSocial,
        contactName: match.nomeContato,
        phone: formatPhoneBR(match.telefone || ''),
        email: match.email,
        companyStreet: match.rua,
        companyNumber: match.numero,
        companyNeighborhood: match.bairro,
        companyCity: match.cidade,
        companyState: match.estado,
        companyCep: match.cep,
      });
      message.success('Dados do cliente carregados automaticamente.');
    } catch (error: any) {
      message.error(`Erro ao buscar cliente: ${error.message}`);
    }
  };

  const handleCepLookup = async (target: 'company' | 'service') => {
    const cep = form.getFieldValue(target === 'company' ? 'companyCep' : 'serviceCep');
    try {
      const lookup = await cepService.lookup(String(cep || ''));
      if (!lookup) {
        return;
      }
      if (target === 'company') {
        form.setFieldsValue({
          companyStreet: lookup.street,
          companyNeighborhood: lookup.neighborhood,
          companyCity: lookup.city,
          companyState: String(lookup.state || '').toUpperCase(),
          companyCep: lookup.cep,
        });
        message.success('Endereço preenchido pelo CEP.');
        return;
      }

      form.setFieldsValue({
        serviceStreet: lookup.street,
        serviceNeighborhood: lookup.neighborhood,
        serviceCity: lookup.city,
        serviceState: String(lookup.state || '').toUpperCase(),
        serviceCep: lookup.cep,
      });
      message.success('Endereço preenchido pelo CEP.');
    } catch (error: any) {
      message.error(error.message || 'Erro ao consultar CEP.');
    }
  };

  const syncClientRecord = async (values: any) => {
    const payload = {
      cnpjCpf: values.companyDocument,
      razaoSocial: values.companyName,
      nomeContato: values.contactName,
      telefone: values.phone,
      email: values.email,
      rua: values.companyStreet || '',
      numero: values.companyNumber || '',
      bairro: values.companyNeighborhood || '',
      cidade: values.companyCity || '',
      estado: values.companyState || '',
      cep: values.companyCep || '',
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
      message.error('A soma das parcelas precisa fechar exatamente o valor líquido (valor do contrato - desconto NF).');
      return;
    }

    try {
      const clientId = await syncClientRecord(values);
      const nextCompanyAddress = buildAddressString({
        street: values.companyStreet,
        number: values.companyNumber,
        neighborhood: values.companyNeighborhood,
        city: values.companyCity,
        state: values.companyState,
        cep: values.companyCep,
      });
      const nextServiceAddress = values.sameAddressAsCompany
        ? nextCompanyAddress
        : buildAddressString({
          street: values.serviceStreet,
          number: values.serviceNumber,
          neighborhood: values.serviceNeighborhood,
          city: values.serviceCity,
          state: values.serviceState,
          cep: values.serviceCep,
        });

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
        companyAddress: nextCompanyAddress,
        serviceAddress: nextServiceAddress,
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
    void (async () => {
      const values = form.getFieldsValue(true);
      const code = editingRecord?.code || servicePreviewCode;
      const nowLabel = dayjs().format('DD/MM/YYYY HH:mm');
      const paymentConditionLabel = values.paymentConditionLabel || paymentConditions.find((item) => item.id === values.paymentConditionId)?.label || '-';

      const providersRows = (linkedProviders || [])
        .map((provider) => `
          <tr>
            <td>${toSafeTextVar(provider.providerName || '-')}</td>
            <td style="text-align:right">${toSafeTextVar(formatCurrency(Number(provider.provisionedValue || 0)))}</td>
            <td style="text-align:right">${toSafeTextVar(formatCurrency(Number(provider.effectiveValue || 0)))}</td>
            <td style="text-align:center">${provider.confirmed ? 'Sim' : 'Nao'}</td>
          </tr>
        `)
        .join('') || '<tr><td colspan="4">Sem prestadores vinculados</td></tr>';

      const installmentsRows = (installments || [])
        .map((installment) => `
          <tr>
            <td style="text-align:center">${installment.number}</td>
            <td style="text-align:right">${toSafeTextVar(formatCurrency(Number(installment.value || 0)))}</td>
            <td style="text-align:center">${installment.date ? dayjs(installment.date).format('DD/MM/YYYY') : '-'}</td>
            <td style="text-align:center">${toSafeTextVar(installment.method || '-')}</td>
          </tr>
        `)
        .join('') || '<tr><td colspan="4">Sem parcelas</td></tr>';

      let templateHtmlRaw = '';
      try {
        const template = await pdfTemplatesService.getByKey('purchase_order');
        templateHtmlRaw = template.html;
      } catch {
        templateHtmlRaw = '';
      }

      const html = templateHtmlRaw
        ? renderPdfTemplate(templateHtmlRaw, {
          code: toSafeTextVar(code),
          generated_at: toSafeTextVar(nowLabel),
          company_document: toSafeTextVar(values.companyDocument || '-'),
          company_name: toSafeTextVar(values.companyName || '-'),
          contact_name: toSafeTextVar(values.contactName || '-'),
          phone: toSafeTextVar(values.phone || '-'),
          email: toSafeTextVar(values.email || '-'),
          company_address: toSafeTextVar(values.companyAddress || '-'),
          service_address: toSafeTextVar(values.serviceAddress || '-'),
          service_type: toSafeTextVar(values.serviceType || '-'),
          subtype: toSafeTextVar(values.subtype || '-'),
          contract_value: toSafeTextVar(formatCurrency(Number(values.contractValue || 0))),
          contract_date: toSafeTextVar(values.contractDate ? dayjs(values.contractDate).format('DD/MM/YYYY') : '-'),
          invoice_value: toSafeTextVar(formatCurrency(Number(values.invoiceValue || 0))),
          payment_condition: toSafeTextVar(paymentConditionLabel),
          installments_rows: installmentsRows,
          providers_rows: providersRows,
        })
        : '';

      const printWindow = window.open('', '_blank', 'width=900,height=900');
      if (!printWindow) {
        message.error('O navegador bloqueou a abertura da janela de impressao.');
        return;
      }

      if (html) {
        printWindow.document.write(html);
      } else {
        printWindow.document.write('<html><body><p>Template de PDF não configurado.</p></body></html>');
      }
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    })();
  };

  const openTemplateEditor = async () => {
    setTemplateLoading(true);
    setTemplateModalOpen(true);
    try {
      const template = await pdfTemplatesService.getByKey('purchase_order');
      setTemplateName(template.name || 'Pedido de compra (Cadastro Único)');
      setTemplateHtml(template.html || '');
    } catch (error: any) {
      setTemplateName('Pedido de compra (Cadastro Único)');
      setTemplateHtml('');
      message.error(error.message || 'Nao foi possivel carregar o template.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      setTemplateLoading(true);
      await pdfTemplatesService.upsert('purchase_order', { name: templateName || 'Pedido de compra', html: templateHtml || '' });
      message.success('Template salvo.');
      setTemplateModalOpen(false);
    } catch (error: any) {
      message.error(error.message || 'Erro ao salvar template.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const openCreatePaymentCondition = () => {
    setEditingPaymentCondition(null);
    paymentConditionForm.resetFields();
    paymentConditionForm.setFieldsValue({ intervalDays: 30, isUndefined: false });
    setPaymentManageOpen(false);
    setPaymentModalOpen(true);
  };

  const openEditPaymentCondition = (record: PaymentConditionRecord) => {
    setEditingPaymentCondition(record);
    paymentConditionForm.setFieldsValue({
      label: record.label,
      installments: record.installments,
      intervalDays: record.intervalDays ?? 30,
      isUndefined: Boolean(record.isUndefined),
    });
    setPaymentManageOpen(false);
    setPaymentModalOpen(true);
  };

  const upsertPaymentCondition = async (values: { label: string; installments: number; intervalDays?: number; isUndefined?: boolean }) => {
    try {
      const created = await cadastrosApi.savePaymentCondition({
        id: editingPaymentCondition?.id,
        label: values.label,
        installments: values.installments,
        intervalDays: values.intervalDays,
        isUndefined: values.isUndefined,
      });
      const conditions = await cadastrosApi.getPaymentConditions();
      setPaymentConditions(conditions);
      form.setFieldsValue({
        paymentConditionId: created.id,
        paymentConditionLabel: created.label,
      });
      const intervalDays = created.isUndefined ? null : (created.intervalDays ?? 30);
      const base = buildInstallments(created.installments, contractValue, {
        startDate: contractDate || dayjs().format('YYYY-MM-DD'),
        intervalDays,
        method: installments[0]?.method || 'Pix',
      });
      setInstallments(applyDiscount(base, invoiceValue, discountRule, discountSpecific));
      paymentConditionForm.resetFields();
      setPaymentModalOpen(false);
      setEditingPaymentCondition(null);
      message.success(editingPaymentCondition ? 'Condicao de pagamento atualizada.' : 'Condicao de pagamento criada.');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const confirmDeletePaymentCondition = (record: PaymentConditionRecord) => {
    modal.confirm({
      title: 'Excluir condição de pagamento?',
      content: `Essa ação remove "${record.label}" definitivamente.`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await cadastrosApi.deletePaymentCondition(record.id);
        const conditions = await cadastrosApi.getPaymentConditions();
        setPaymentConditions(conditions);
        if (form.getFieldValue('paymentConditionId') === record.id) {
          form.setFieldsValue({ paymentConditionId: undefined, paymentConditionLabel: '' });
          setInstallments([]);
        }
        message.success('Condição removida.');
      },
    });
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
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item name="companyCep" label="CEP" normalize={normalizeCepBR}>
                            <Input
                              className="atlas-services-input"
                              onBlur={() => void handleCepLookup('company')}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item name="companyStreet" label="Logradouro">
                            <Input className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={5}>
                          <Form.Item name="companyNumber" label="Número">
                            <Input className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item name="companyNeighborhood" label="Bairro">
                            <Input className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="companyCity" label="Cidade">
                            <Input className="atlas-services-input" />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item name="companyState" label="UF">
                            <Input className="atlas-services-input" maxLength={2} onChange={(event) => form.setFieldValue('companyState', event.target.value.toUpperCase())} />
                          </Form.Item>
                        </Col>
                      </Row>
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
                              mode="tags"
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
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item name="serviceCep" label="CEP" normalize={normalizeCepBR}>
                            <Input
                              className="atlas-services-input"
                              disabled={sameAddress}
                              onBlur={() => void handleCepLookup('service')}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item name="serviceStreet" label="Logradouro">
                            <Input className="atlas-services-input" disabled={sameAddress} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={5}>
                          <Form.Item name="serviceNumber" label="Número">
                            <Input className="atlas-services-input" disabled={sameAddress} />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item name="serviceNeighborhood" label="Bairro">
                            <Input className="atlas-services-input" disabled={sameAddress} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="serviceCity" label="Cidade">
                            <Input className="atlas-services-input" disabled={sameAddress} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item name="serviceState" label="UF">
                            <Input className="atlas-services-input" maxLength={2} disabled={sameAddress} onChange={(event) => form.setFieldValue('serviceState', event.target.value.toUpperCase())} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="companyAddress" hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item name="serviceAddress" hidden>
                        <Input />
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
                        <InputNumber
                          className="atlas-services-number"
                          style={{ width: '100%' }}
                          min={0}
                          formatter={formatCurrencyInput}
                          parser={parseCurrencyInput}
                        />
                      </Form.Item>
                      <Form.Item name="contractDate" label="Data do contrato" rules={[{ required: true, message: 'Informe a data do contrato' }]}>
                        <Input type="date" className="atlas-services-input" />
                      </Form.Item>
                      <Form.Item name="invoiceValue" label="Desconto NF (opcional)">
                        <InputNumber
                          className="atlas-services-number"
                          style={{ width: '100%' }}
                          min={0}
                          max={contractValue || undefined}
                          formatter={formatCurrencyInput}
                          parser={parseCurrencyInput}
                        />
                      </Form.Item>
                      <Form.Item label="Regra do desconto NF">
                        <Select
                          className="atlas-services-select"
                          value={discountRule}
                          options={[
                            { label: '1ª parcela', value: 'FIRST' },
                            { label: 'Todas as parcelas', value: 'ALL' },
                            { label: 'Parcelas específicas', value: 'SPECIFIC' },
                          ]}
                          onChange={(value: DiscountRule) => {
                            setDiscountRule(value);
                            if (value === 'SPECIFIC' && (!discountSpecific || !discountSpecific.length)) {
                              setDiscountSpecific([1]);
                            }
                          }}
                        />
                      </Form.Item>
                      {discountRule === 'SPECIFIC' ? (
                        <Form.Item label="Quais parcelas recebem o desconto">
                          <Select
                            className="atlas-services-select"
                            mode="multiple"
                            value={discountSpecific}
                            options={installments.map((item) => ({ label: `Parcela ${item.number}`, value: item.number }))}
                            onChange={(values) => setDiscountSpecific(values as number[])}
                          />
                        </Form.Item>
                      ) : null}
                      <Form.Item name="paymentConditionId" label="Condicao de pagamento" rules={[{ required: true, message: 'Selecione uma condicao' }]}>
                        <Select
                          className="atlas-services-select"
                          options={paymentConditions.map((item) => ({ label: item.label, value: item.id }))}
                          dropdownRender={(menu) => (
                            <>
                              {menu}
                              <div style={{ padding: 8 }}>
                                <Space>
                                  <Button type="link" icon={<PlusOutlined />} onClick={openCreatePaymentCondition}>
                                    Criar nova
                                  </Button>
                                  <Button type="link" onClick={() => setPaymentManageOpen(true)}>
                                    Gerenciar
                                  </Button>
                                </Space>
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
                        <Space wrap>
                          <Checkbox
                            checked={recalcDatesFromFirst}
                            disabled={!selectedPaymentCondition || Boolean(selectedPaymentCondition.isUndefined)}
                            onChange={(event) => setRecalcDatesFromFirst(event.target.checked)}
                          >
                            Recalcular datas (a partir da 1ª parcela)
                          </Checkbox>
                          <Checkbox
                            checked={propagateMethodToAll}
                            onChange={(event) => setPropagateMethodToAll(event.target.checked)}
                          >
                            Aplicar forma em todas
                          </Checkbox>
                        </Space>
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
                                formatter={formatCurrencyInput}
                                parser={parseCurrencyInput}
                                onChange={(value) => setInstallments((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, value: Number(value || 0) } : currentItem))}
                              />
                            </Col>
                            <Col xs={24} md={7}>
                              <Input
                                type="date"
                                className="atlas-services-input"
                                value={item.date}
                                onChange={(event) => {
                                  const nextDate = event.target.value;
                                  setInstallments((current) => {
                                    if (
                                      index === 0
                                      && recalcDatesFromFirst
                                      && selectedPaymentCondition
                                      && !selectedPaymentCondition.isUndefined
                                      && (selectedPaymentCondition.intervalDays ?? 30)
                                      && nextDate
                                    ) {
                                      const interval = selectedPaymentCondition.intervalDays ?? 30;
                                      return current.map((currentItem, currentIndex) => ({
                                        ...currentItem,
                                        date: dayjs(nextDate).add(currentIndex * interval, 'day').format('YYYY-MM-DD'),
                                      }));
                                    }
                                    return current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, date: nextDate } : currentItem);
                                  });
                                }}
                              />
                            </Col>
                            <Col xs={24} md={7}>
                              <Select
                                className="atlas-services-select"
                                options={PAYMENT_METHOD_OPTIONS}
                                value={item.method}
                                onChange={(value) => setInstallments((current) => {
                                  if (propagateMethodToAll) {
                                    return current.map((currentItem) => ({ ...currentItem, method: value }));
                                  }
                                  return current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, method: value } : currentItem);
                                })}
                              />
                            </Col>
                          </Row>
                        ))}
                        <Text type={paymentMismatch ? 'danger' : 'secondary'}>
                          Soma das parcelas: {formatCurrency(paymentTotal)} | Total líquido: {formatCurrency(netTotal)} (Contrato {formatCurrency(contractValue)} - Desconto {formatCurrency(invoiceValue)})
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
                              paymentDateType: 'A_DEFINIR',
                              paymentDate: '',
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
                        <Col xs={24} md={4}>
                          <InputNumber
                            className="atlas-services-number"
                            style={{ width: '100%' }}
                            min={0}
                            value={item.effectiveValue}
                            onChange={(value) => setLinkedProviders((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, effectiveValue: Number(value || 0) } : currentItem))}
                          />
                        </Col>
                        <Col xs={24} md={5}>
                          <Select
                            className="atlas-services-select"
                            options={PROVIDER_PAYMENT_DATE_TYPE_OPTIONS as any}
                            value={item.paymentDateType || 'A_DEFINIR'}
                            onChange={(value) => setLinkedProviders((current) => current.map((currentItem, currentIndex) => currentIndex === index ? {
                              ...currentItem,
                              paymentDateType: value,
                              paymentDate: value === 'DATA' ? (currentItem.paymentDate || dayjs().format('YYYY-MM-DD')) : '',
                            } : currentItem))}
                          />
                          {item.paymentDateType === 'DATA' ? (
                            <Input
                              type="date"
                              className="atlas-services-input"
                              style={{ marginTop: 6 }}
                              value={item.paymentDate || ''}
                              onChange={(event) => setLinkedProviders((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, paymentDate: event.target.value } : currentItem))}
                            />
                          ) : null}
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
          <Button className="atlas-services-button" onClick={() => void openTemplateEditor()}>
            Modelo PDF
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

      <PdfTemplateEditorModal
        open={templateModalOpen}
        title="Modelo de PDF: Pedido de compra"
        confirmLoading={templateLoading}
        onCancel={() => setTemplateModalOpen(false)}
        onSave={saveTemplate}
        variant="drawer"
        templateName={templateName}
        templateHtml={templateHtml}
        onChangeName={setTemplateName}
        onChangeHtml={setTemplateHtml}
        helperText={
          <>Use placeholders como {'{{code}}'} e blocos HTML: {'{{installments_rows}}'}, {'{{providers_rows}}'}.</>
        }
        placeholders={[
          { key: 'code', label: 'Código', description: 'Identificador do cadastro.' },
          { key: 'generated_at', label: 'Gerado em', description: 'Data/hora de geração.' },
          { key: 'company_document', label: 'Documento', description: 'CPF/CNPJ do cliente.' },
          { key: 'company_name', label: 'Razão social', description: 'Nome da empresa.' },
          { key: 'contact_name', label: 'Contato', description: 'Responsável.' },
          { key: 'phone', label: 'Telefone', description: 'Telefone principal.' },
          { key: 'email', label: 'E-mail', description: 'E-mail principal.' },
          { key: 'company_address', label: 'Endereço', description: 'Endereço do cliente.' },
          { key: 'service_address', label: 'Local', description: 'Local do serviço.' },
          { key: 'service_type', label: 'Tipo', description: 'Tipo de serviço.' },
          { key: 'subtype', label: 'Subtipo', description: 'Subtipo do serviço.' },
          { key: 'contract_value', label: 'Contrato', description: 'Valor do contrato.' },
          { key: 'contract_date', label: 'Data contrato', description: 'Data do contrato.' },
          { key: 'invoice_value', label: 'Fatura', description: 'Valor da fatura.' },
          { key: 'payment_condition', label: 'Condição', description: 'Condição de pagamento.' },
          { key: 'installments_rows', label: 'Parcelas', description: 'Linhas HTML (tabela) das parcelas.' },
          { key: 'providers_rows', label: 'Prestadores', description: 'Linhas HTML (tabela) dos prestadores.' },
        ]}
        previewVariables={{
          code: toSafeTextVar(editingRecord?.code || 'ATLAS-0001'),
          generated_at: toSafeTextVar(dayjs().format('DD/MM/YYYY HH:mm')),
          company_document: toSafeTextVar(form.getFieldValue('companyDocument') || '00.000.000/0001-00'),
          company_name: toSafeTextVar(form.getFieldValue('companyName') || 'Empresa Exemplo LTDA'),
          contact_name: toSafeTextVar(form.getFieldValue('contactName') || 'Fulano de Tal'),
          phone: toSafeTextVar(form.getFieldValue('phone') || '(11) 99999-9999'),
          email: toSafeTextVar(form.getFieldValue('email') || 'contato@exemplo.com'),
          company_address: toSafeTextVar(form.getFieldValue('companyAddress') || 'Rua Exemplo, 123 - Centro'),
          service_address: toSafeTextVar(form.getFieldValue('serviceAddress') || 'Av. Modelo, 456 - Bairro'),
          service_type: toSafeTextVar(form.getFieldValue('serviceType') || 'AVCB'),
          subtype: toSafeTextVar(form.getFieldValue('subtype') || '-'),
          contract_value: toSafeTextVar(formatCurrency(Number(form.getFieldValue('contractValue') || 0) || 0)),
          contract_date: toSafeTextVar(form.getFieldValue('contractDate') ? dayjs(form.getFieldValue('contractDate')).format('DD/MM/YYYY') : '-'),
          invoice_value: toSafeTextVar(formatCurrency(Number(form.getFieldValue('invoiceValue') || 0) || 0)),
          payment_condition: toSafeTextVar(form.getFieldValue('paymentConditionLabel') || '-'),
          installments_rows:
            '<tr><td style="text-align:center">1</td><td style="text-align:right">R$ 1.000,00</td><td style="text-align:center">10/04/2026</td><td style="text-align:center">Pix</td></tr>',
          providers_rows:
            '<tr><td>Prestador Exemplo</td><td style="text-align:right">R$ 500,00</td><td style="text-align:right">R$ 450,00</td><td style="text-align:center">Sim</td></tr>',
        }}
      />

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
            placeholder="Filtrar por codigo, telefone, valor, tipo ou data"
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
              { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
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
        title={editingPaymentCondition ? 'Editar condição de pagamento' : 'Nova condição de pagamento'}
        className="atlas-services-modal"
      >
        <Form form={paymentConditionForm} layout="vertical" onFinish={upsertPaymentCondition}>
          <Form.Item name="label" label="Nome da condicao" rules={[{ required: true, message: 'Informe a condicao' }]}>
            <Input className="atlas-services-input" />
          </Form.Item>
          <Form.Item name="installments" label="Quantidade de parcelas" rules={[{ required: true, message: 'Informe a quantidade' }]}>
            <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="intervalDays" label="Intervalo (dias)">
                <InputNumber
                  className="atlas-services-number"
                  style={{ width: '100%' }}
                  min={1}
                  disabled={paymentConditionIndefinido}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="isUndefined" valuePropName="checked" label=" ">
                <Checkbox>Indefinido</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Button htmlType="submit" type="primary" icon={<PlusOutlined />} className="atlas-services-button atlas-services-button-primary">
            {editingPaymentCondition ? 'Salvar condição' : 'Criar condição'}
          </Button>
          {editingPaymentCondition ? (
            <Button
              danger
              style={{ marginLeft: 12 }}
              onClick={() => {
                confirmDeletePaymentCondition(editingPaymentCondition);
                setPaymentModalOpen(false);
                setEditingPaymentCondition(null);
              }}
            >
              Excluir
            </Button>
          ) : null}
        </Form>
      </Modal>

      <Modal
        open={paymentManageOpen}
        onCancel={() => setPaymentManageOpen(false)}
        footer={null}
        title="Condições de pagamento"
        width={820}
        className="atlas-services-modal"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePaymentCondition}>
            Nova condição
          </Button>
          <Table
            rowKey="id"
            dataSource={paymentConditions}
            pagination={{ pageSize: 6 }}
            columns={[
              { title: 'Nome', dataIndex: 'label', key: 'label' },
              { title: 'Parcelas', dataIndex: 'installments', key: 'installments' },
              {
                title: 'Intervalo',
                key: 'intervalDays',
                render: (_, record: PaymentConditionRecord) => (record.isUndefined ? 'Indefinido' : `${record.intervalDays ?? 30} dias`),
              },
              {
                title: 'Ações',
                key: 'actions',
                render: (_, record: PaymentConditionRecord) => (
                  <Space>
                    <Button onClick={() => openEditPaymentCondition(record)}>Editar</Button>
                    <Button danger onClick={() => confirmDeletePaymentCondition(record)}>Excluir</Button>
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
