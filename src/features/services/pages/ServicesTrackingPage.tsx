/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CalendarOutlined,
  EditOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatPhoneBR, normalizePhoneBR } from '../../../shared/utils/inputFormat';
import { htmlToPlainText } from '../../../core/utils/text';
import { ExcelLikeTable } from '../../../shared/components/table/ExcelLikeTable';
import { pdfTemplatesService } from '../../../core/services/pdfTemplatesService';
import { renderPdfTemplate, toSafeTextVar } from '../../../shared/utils/pdfTemplate';
import {
  servicesTrackingApi,
  type ServiceHistoryEntry,
  type ServiceKind,
  type ServicePendingCondition,
  type ServiceSituationConfig,
  type ServiceSituationConditionItem,
  type ServiceSituationConfigItem,
  type TrackingServiceDto,
  type TrackingServiceUpdatePayload,
} from '../servicesTrackingApi';

const { Title, Text } = Typography;

type EditableField = 'subtype' | 'situation' | 'description';

interface UnifiedServiceRow {
  key: string;
  id: number;
  origemId: number;
  serviceType: ServiceKind;
  code: string;
  clientName: string;
  phone: string;
  subtype: string;
  situation: string;
  situationDurationDays: number;
  description: string;
  contractValue: number;
  contractDate: string;
  paymentCondition: string;
  receivable: number;
  received: number;
  costs: number;
  folderUrl: string;
  editPath: string;
  pendingConditions: ServicePendingCondition[];
}

interface InlineEditState {
  key: string;
  field: EditableField;
  value: string;
}

interface InspectionSchedule {
  start: string;
  end: string;
  location: string;
}

type InspectionScheduleMap = Record<string, InspectionSchedule>;

const INSPECTION_STORAGE_KEY = 'atlas.service_tracking.inspection_schedule';
const LEGACY_INSPECTION_STORAGE_KEY = 'prevent.service_tracking.inspection_schedule';

const readInspectionScheduleMap = (): InspectionScheduleMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(INSPECTION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as InspectionScheduleMap;
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_INSPECTION_STORAGE_KEY);
    if (legacyRaw) {
      window.localStorage.setItem(INSPECTION_STORAGE_KEY, legacyRaw);
      return JSON.parse(legacyRaw) as InspectionScheduleMap;
    }

    return {};
  } catch {
    return {};
  }
};

const writeInspectionScheduleMap = (value: InspectionScheduleMap) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INSPECTION_STORAGE_KEY, JSON.stringify(value));
};

const buildGoogleCalendarUrl = (params: { title: string; details?: string; location?: string; start: dayjs.Dayjs; end: dayjs.Dayjs }) => {
  const timeZone = 'America/Sao_Paulo';
  const start = params.start.format('YYYYMMDDTHHmmss');
  const end = params.end.format('YYYYMMDDTHHmmss');

  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${start}/${end}`,
    ctz: timeZone,
  });

  if (params.details) query.set('details', params.details);
  if (params.location) query.set('location', params.location);

  return `https://calendar.google.com/calendar/render?${query.toString()}`;
};

const SERVICE_TYPE_OPTIONS = [
  { label: 'AVCB', value: 'AVCB' },
  { label: 'CLCB', value: 'CLCB' },
  { label: 'Obras', value: 'OBRAS' },
  { label: 'Proc. Adm.', value: 'PROCESSOS_ADM' },
] satisfies { label: string; value: ServiceKind }[];

const DEFAULT_SUBTYPE_OPTIONS: Record<ServiceKind, string[]> = {
  AVCB: ['Projeto', 'Renovacao', 'Regularizacao'],
  CLCB: ['Projeto', 'Renovacao', 'Ajuste'],
  OBRAS: ['Residencial', 'Comercial', 'Industrial'],
  PROCESSOS_ADM: ['Contrato', 'Renovacao', 'Regularizacao'],
};

const EMPTY_SITUATION_CONFIG: ServiceSituationConfig = {
  AVCB: [],
  CLCB: [],
  OBRAS: [],
  PROCESSOS_ADM: [],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(value) ? value : 0);

const mapServiceRow = (item: TrackingServiceDto): UnifiedServiceRow => ({
  key: String(item.id),
  id: item.id,
  origemId: item.origemId,
  serviceType: item.tipoServico,
  code: item.codigo,
  clientName: item.nomeCliente || 'Nao informado',
  phone: formatPhoneBR(item.telefone || '-') || '-',
  subtype: item.subtipo || DEFAULT_SUBTYPE_OPTIONS[item.tipoServico][0] || '',
  situation: item.situacao,
  situationDurationDays: Math.max(Number(item.tempoNaSituacao || 0), 0),
  description: htmlToPlainText(item.descricao || ''),
  contractValue: Number(item.valorContrato || 0),
  contractDate: item.dataContrato || '',
  paymentCondition: item.condicaoPagamento || '-',
  receivable: Number(item.aReceber || 0),
  received: Number(item.recebido || 0),
  costs: Number(item.custos || 0),
  folderUrl: item.folderUrl || '',
  pendingConditions: (item.pendencias || []).map((p) => ({
    id: p.id,
    label: p.label,
    done: Boolean(p.concluida),
    createdAt: p.createdAt || '',
    doneAt: p.concluidaEm || '',
  })),
  editPath: item.tipoServico === 'AVCB'
    ? `/avcb/${item.origemId}/editar`
    : item.tipoServico === 'CLCB'
      ? `/clcb/${item.origemId}/editar`
      : item.tipoServico === 'OBRAS'
        ? `/obras/${item.origemId}/editar`
        : `/processos/${item.origemId}/editar`,
});

const toUpdatePayload = (row: UnifiedServiceRow): TrackingServiceUpdatePayload => ({
  nomeCliente: row.clientName,
  telefone: row.phone === '-' ? '' : row.phone,
  tipoServico: row.serviceType,
  subtipo: row.subtype,
  situacao: row.situation,
  descricao: row.description,
  valorContrato: row.contractValue,
  dataContrato: row.contractDate || undefined,
  condicaoPagamento: row.paymentCondition === '-' ? '' : row.paymentCondition,
  aReceber: row.receivable,
  recebido: row.received,
  custos: row.costs,
  folderUrl: row.folderUrl,
});

const createSituationConfigMap = (
  entries: Array<{ type: ServiceKind; items: ServiceSituationConfigItem[] }>
): ServiceSituationConfig => {
  const config = { ...EMPTY_SITUATION_CONFIG };
  entries.forEach(({ type, items }) => {
    config[type] = items;
  });
  return config;
};

export const ServicesTrackingPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [rows, setRows] = useState<UnifiedServiceRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<ServiceKind | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [situationConfig, setSituationConfig] = useState<ServiceSituationConfig>(EMPTY_SITUATION_CONFIG);
  const [historyMap, setHistoryMap] = useState<Record<string, ServiceHistoryEntry[]>>({});
  const [drawerRow, setDrawerRow] = useState<UnifiedServiceRow | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [drawerForm] = Form.useForm();
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [conditionEditing, setConditionEditing] = useState<{
    type: ServiceKind;
    situationId: number;
    condition?: ServiceSituationConditionItem | null;
  } | null>(null);
  const [conditionForm] = Form.useForm();
  const [inspectionScheduleMap, setInspectionScheduleMap] = useState<InspectionScheduleMap>(() => readInspectionScheduleMap());
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionDraftStart, setInspectionDraftStart] = useState<dayjs.Dayjs | null>(null);
  const [inspectionDraftLocation, setInspectionDraftLocation] = useState('');
  const [lastDrawerSituation, setLastDrawerSituation] = useState('');
  const [reportTemplateModalOpen, setReportTemplateModalOpen] = useState(false);
  const [reportTemplateLoading, setReportTemplateLoading] = useState(false);
  const [reportTemplateName, setReportTemplateName] = useState('');
  const [reportTemplateHtml, setReportTemplateHtml] = useState('');

  const drawerSituation = Form.useWatch<string>('situation', drawerForm) || '';

  const isInspectionSituation = (value: string) => value.toLowerCase().includes('vistoria');

  const loadSituationConfig = useCallback(async () => {
    const responses = await Promise.all(
      SERVICE_TYPE_OPTIONS.map(async (serviceType) => ({
        type: serviceType.value,
        items: await servicesTrackingApi.getSituations(serviceType.value),
      }))
    );
    setSituationConfig(createSituationConfigMap(responses));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [services,] = await Promise.all([
        servicesTrackingApi.getAll({ size: 500 }),
        loadSituationConfig(),
      ]);
      setRows(services.content.map(mapServiceRow));
    } catch (error: any) {
      message.error(`Erro ao carregar painel de acompanhamento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [loadSituationConfig, message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!drawerRow) {
      drawerForm.resetFields();
      setLastDrawerSituation('');
      return;
    }

    drawerForm.setFieldsValue({
      ...drawerRow,
      description: htmlToPlainText(drawerRow.description || ''),
      contractDate: drawerRow.contractDate ? dayjs(drawerRow.contractDate) : null,
    });

    setLastDrawerSituation(drawerRow.situation || '');
  }, [drawerForm, drawerRow]);

  useEffect(() => {
    if (!drawerRow) return;
    if (!drawerSituation) return;

    const previousWasInspection = isInspectionSituation(lastDrawerSituation);
    const currentIsInspection = isInspectionSituation(drawerSituation);

    if (!previousWasInspection && currentIsInspection && !inspectionScheduleMap[drawerRow.key]) {
      setInspectionDraftStart(dayjs().add(1, 'day').hour(9).minute(0).second(0));
      setInspectionDraftLocation('');
      setInspectionModalOpen(true);
    }

    setLastDrawerSituation(drawerSituation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerRow?.key, drawerSituation]);

  const openInspectionOnGoogleCalendar = () => {
    if (!drawerRow) return;

    const schedule = inspectionScheduleMap[drawerRow.key];
    if (!schedule) {
      setInspectionDraftStart(dayjs().add(1, 'day').hour(9).minute(0).second(0));
      setInspectionDraftLocation('');
      setInspectionModalOpen(true);
      return;
    }

    const url = buildGoogleCalendarUrl({
      title: `Vistoria - ${drawerRow.code} - ${drawerRow.clientName}`,
      details: [
        `Servico: ${drawerRow.serviceType}`,
        drawerRow.subtype ? `Subtipo: ${drawerRow.subtype}` : null,
        drawerRow.phone ? `Telefone: ${drawerRow.phone}` : null,
        drawerRow.folderUrl ? `Pasta: ${drawerRow.folderUrl}` : null,
      ].filter(Boolean).join('\\n'),
      location: schedule.location || undefined,
      start: dayjs(schedule.start),
      end: dayjs(schedule.end),
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const confirmInspectionSchedule = () => {
    if (!drawerRow) return;
    if (!inspectionDraftStart) {
      message.warning('Selecione a data e horario da vistoria.');
      return;
    }

    const start = inspectionDraftStart;
    const end = inspectionDraftStart.add(60, 'minute');
    const location = inspectionDraftLocation.trim();

    const nextMap: InspectionScheduleMap = {
      ...inspectionScheduleMap,
      [drawerRow.key]: {
        start: start.toISOString(),
        end: end.toISOString(),
        location,
      },
    };

    setInspectionScheduleMap(nextMap);
    writeInspectionScheduleMap(nextMap);
    setInspectionModalOpen(false);

    const url = buildGoogleCalendarUrl({
      title: `Vistoria - ${drawerRow.code} - ${drawerRow.clientName}`,
      details: [
        `Servico: ${drawerRow.serviceType}`,
        drawerRow.subtype ? `Subtipo: ${drawerRow.subtype}` : null,
        drawerRow.phone ? `Telefone: ${drawerRow.phone}` : null,
        drawerRow.folderUrl ? `Pasta: ${drawerRow.folderUrl}` : null,
      ].filter(Boolean).join('\\n'),
      location: location || undefined,
      start,
      end,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesType = typeFilter === 'ALL' || row.serviceType === typeFilter;
    const haystack = [
      row.code,
      row.clientName,
      row.phone,
      row.serviceType,
      row.subtype,
      row.situation,
      row.description,
    ].join(' ').toLowerCase();

    return matchesType && haystack.includes(searchText.trim().toLowerCase());
  }), [rows, searchText, typeFilter]);

  const replaceRow = (row: UnifiedServiceRow) => {
    setRows((current) => current.map((item) => item.key === row.key ? row : item));
    setDrawerRow((current) => current?.key === row.key ? row : current);
  };

  const openDrawer = useCallback(async (row: UnifiedServiceRow) => {
    setDrawerRow(row);
    try {
      const detail = await servicesTrackingApi.getById(row.id);
      const nextRow = mapServiceRow(detail.service);
      replaceRow(nextRow);
      setHistoryMap((current) => ({
        ...current,
        [nextRow.key]: detail.history,
      }));
    } catch (error: any) {
      message.error(`Erro ao carregar detalhes do serviço: ${error.message}`);
    }
  }, [message]);

  const persistRow = async (row: UnifiedServiceRow, successMessage: string) => {
    const updated = await servicesTrackingApi.update(row.id, toUpdatePayload(row));
    const nextRow = mapServiceRow(updated);
    replaceRow(nextRow);
    message.success(successMessage);
    return nextRow;
  };

  const applySituationChange = async (row: UnifiedServiceRow, nextSituation: string, changeDescription: string) => {
    const hasPending = (row.pendingConditions || []).some((item) => !item.done);
    if (hasPending && nextSituation !== row.situation) {
      message.error('Não é possível trocar a situação enquanto houver pendências em aberto.');
      throw new Error('Pendências em aberto.');
    }

    const detail = await servicesTrackingApi.updateSituation(row.id, nextSituation, changeDescription);
    const nextRow = mapServiceRow(detail.service);
    replaceRow(nextRow);
    setHistoryMap((current) => ({
      ...current,
      [nextRow.key]: detail.history,
    }));
    message.success('Situacao atualizada.');
    return nextRow;
  };

  const concludePendingCondition = async (row: UnifiedServiceRow, pendingId: number) => {
    try {
      await servicesTrackingApi.concludePendingCondition(pendingId);
      const detail = await servicesTrackingApi.getById(row.id);
      const nextRow = mapServiceRow(detail.service);
      replaceRow(nextRow);
      setHistoryMap((current) => ({ ...current, [nextRow.key]: detail.history }));
      message.success('Pendência concluída.');
    } catch (error: any) {
      message.error(error.message || 'Erro ao concluir pendência.');
    }
  };

  const saveInlineEdit = async (row: UnifiedServiceRow) => {
    if (!inlineEdit || inlineEdit.key !== row.key) {
      return;
    }

    const nextValue = inlineEdit.value;
    const nextRow: UnifiedServiceRow = inlineEdit.field === 'subtype'
      ? { ...row, subtype: nextValue }
      : inlineEdit.field === 'description'
        ? { ...row, description: nextValue }
        : { ...row, situation: nextValue };

    try {
      if (inlineEdit.field === 'situation') {
        await applySituationChange(row, nextValue, row.description || 'Mudanca realizada na tabela de acompanhamento');
      } else {
        await persistRow(nextRow, 'Campo atualizado.');
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setInlineEdit(null);
    }
  };

  const saveDrawer = async (values: any) => {
    if (!drawerRow) {
      return;
    }

    const pendingOpen = (drawerRow.pendingConditions || []).some((item) => !item.done);
    if (pendingOpen && values.situation !== drawerRow.situation) {
      message.error('Conclua as pendências antes de alterar a situação.');
      drawerForm.setFieldValue('situation', drawerRow.situation);
      return;
    }

    const nextRow: UnifiedServiceRow = {
      ...drawerRow,
      clientName: values.clientName,
      phone: values.phone || '-',
      subtype: values.subtype || '',
      situation: values.situation,
      description: htmlToPlainText(values.description || ''),
      contractValue: Number(values.contractValue || 0),
      contractDate: values.contractDate ? values.contractDate.format('YYYY-MM-DD') : '',
      paymentCondition: values.paymentCondition || '-',
      receivable: Number(values.receivable || 0),
      received: Number(values.received || 0),
      costs: Number(values.costs || 0),
      folderUrl: values.folderUrl || '',
    };

    try {
      const shouldUseSituationEndpoint = nextRow.situation !== drawerRow.situation;
      const baseRow = shouldUseSituationEndpoint
        ? await applySituationChange(drawerRow, nextRow.situation, nextRow.description || 'Mudança de situação no acompanhamento')
        : drawerRow;

      const savedRow = await persistRow({ ...baseRow, ...nextRow }, 'Cadastro atualizado com sucesso.');
      const detail = await servicesTrackingApi.getById(savedRow.id);
      setHistoryMap((current) => ({
        ...current,
        [savedRow.key]: detail.history,
      }));
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const exportRowPdf = async (row: UnifiedServiceRow) => {
    try {
      const detail = await servicesTrackingApi.getReport(row.id);
      const reportRow = mapServiceRow(detail.service);

      let templateHtmlRaw = '';
      try {
        const template = await pdfTemplatesService.getByKey('service_report');
        templateHtmlRaw = template.html;
      } catch {
        templateHtmlRaw = '';
      }

      const html = templateHtmlRaw
        ? renderPdfTemplate(templateHtmlRaw, {
          code: toSafeTextVar(reportRow.code),
          client_name: toSafeTextVar(reportRow.clientName),
          generated_at: toSafeTextVar(dayjs().format('DD/MM/YYYY HH:mm')),
          service_type: toSafeTextVar(reportRow.serviceType === 'PROCESSOS_ADM' ? 'Proc. Adm.' : reportRow.serviceType),
          subtype: toSafeTextVar(reportRow.subtype || '-'),
          situation: toSafeTextVar(reportRow.situation || '-'),
          pending_conditions: toSafeTextVar((reportRow.pendingConditions || []).filter((p) => !p.done).map((p) => p.label).join(', ') || '-'),
          description: toSafeTextVar(reportRow.description || '-'),
          phone: toSafeTextVar(reportRow.phone || '-'),
          contract_value: toSafeTextVar(formatCurrency(reportRow.contractValue)),
          contract_date: toSafeTextVar(reportRow.contractDate ? dayjs(reportRow.contractDate).format('DD/MM/YYYY') : '-'),
          payment_condition: toSafeTextVar(reportRow.paymentCondition || '-'),
          receivable: toSafeTextVar(formatCurrency(reportRow.receivable)),
          received: toSafeTextVar(formatCurrency(reportRow.received)),
          costs: toSafeTextVar(formatCurrency(reportRow.costs)),
          folder_url: toSafeTextVar(reportRow.folderUrl || '-'),
        })
        : '';

      const printWindow = window.open('', '_blank', 'width=900,height=900');
      if (!printWindow) {
        message.error('O navegador bloqueou a abertura da janela de impressao.');
        return;
      }
      printWindow.document.write(html || '<html><body><p>Template de PDF não configurado.</p></body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error: any) {
      message.error(`Erro ao gerar relatorio: ${error.message}`);
    }
  };

  const updateSituationItem = async (
    type: ServiceKind,
    item: ServiceSituationConfigItem,
    patch: Partial<ServiceSituationConfigItem>,
    successMessage: string
  ) => {
    const nextItem = { ...item, ...patch };
    try {
      await servicesTrackingApi.updateSituationConfig(type, nextItem);
      await loadSituationConfig();
      message.success(successMessage);
    } catch (error: any) {
      message.error(error.message);
      await loadSituationConfig();
    }
  };

  const addSituation = async (type: ServiceKind) => {
    try {
      await servicesTrackingApi.createSituation(type, {
        label: 'NOVA_SITUACAO',
        order: situationConfig[type].length + 1,
        isDefault: false,
        active: true,
      });
      await loadSituationConfig();
      message.success('Situacao adicionada.');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const deleteSituation = async (item: ServiceSituationConfigItem) => {
    try {
      await servicesTrackingApi.deleteSituationConfig(item.id);
      await loadSituationConfig();
      message.success('Situacao removida.');
    } catch (error: any) {
      message.error(error.message);
      await loadSituationConfig();
    }
  };

  const openCreateCondition = (type: ServiceKind, situation: ServiceSituationConfigItem) => {
    setConditionEditing({ type, situationId: situation.id, condition: null });
    conditionForm.resetFields();
    conditionForm.setFieldsValue({
      label: 'NOVA_PENDENCIA',
      active: true,
      order: (situation.conditions?.length || 0) + 1,
    });
    setConditionModalOpen(true);
  };

  const openEditCondition = (type: ServiceKind, situation: ServiceSituationConfigItem, condition: ServiceSituationConditionItem) => {
    setConditionEditing({ type, situationId: situation.id, condition });
    conditionForm.setFieldsValue({
      label: condition.label,
      active: condition.active ?? true,
      order: condition.order ?? null,
    });
    setConditionModalOpen(true);
  };

  const deleteCondition = async (conditionId: number) => {
    try {
      await servicesTrackingApi.deleteSituationCondition(conditionId);
      await loadSituationConfig();
      message.success('Pendencia removida.');
    } catch (error: any) {
      message.error(error.message);
      await loadSituationConfig();
    }
  };

  const saveCondition = async (values: any) => {
    if (!conditionEditing) {
      return;
    }
    try {
      if (conditionEditing.condition?.id) {
        await servicesTrackingApi.updateSituationCondition(conditionEditing.condition.id, {
          label: String(values.label || '').toUpperCase(),
          order: values.order ?? null,
          active: Boolean(values.active),
        });
      } else {
        await servicesTrackingApi.createSituationCondition(conditionEditing.situationId, {
          label: String(values.label || '').toUpperCase(),
          order: values.order ?? null,
          active: Boolean(values.active),
        });
      }
      await loadSituationConfig();
      setConditionModalOpen(false);
      setConditionEditing(null);
      conditionForm.resetFields();
      message.success('Pendencia salva.');
    } catch (error: any) {
      message.error(error.message);
      await loadSituationConfig();
    }
  };

  const openSettings = async () => {
    setSettingsLoading(true);
    setSettingsOpen(true);
    try {
      await loadSituationConfig();
    } finally {
      setSettingsLoading(false);
    }
  };

  const openReportTemplateEditor = async () => {
    setReportTemplateLoading(true);
    setReportTemplateModalOpen(true);
    try {
      const template = await pdfTemplatesService.getByKey('service_report');
      setReportTemplateName(template.name || 'Relatório do Acompanhamento');
      setReportTemplateHtml(template.html || '');
    } catch (error: any) {
      setReportTemplateName('Relatório do Acompanhamento');
      setReportTemplateHtml('');
      message.error(error.message || 'Nao foi possivel carregar o template.');
    } finally {
      setReportTemplateLoading(false);
    }
  };

  const saveReportTemplate = async () => {
    try {
      setReportTemplateLoading(true);
      await pdfTemplatesService.upsert('service_report', { name: reportTemplateName || 'Relatório', html: reportTemplateHtml || '' });
      message.success('Template salvo.');
      setReportTemplateModalOpen(false);
    } catch (error: any) {
      message.error(error.message || 'Erro ao salvar template.');
    } finally {
      setReportTemplateLoading(false);
    }
  };

  const columns: ColumnsType<UnifiedServiceRow> = [
    {
      title: 'Codigo',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Nome do cliente',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 180,
    },
    {
      title: 'Telefone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      responsive: ['lg'],
    },
    {
      title: 'Tipo de servico',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 150,
      render: (value: ServiceKind) => value === 'PROCESSOS_ADM' ? 'Proc. Adm.' : value,
    },
    {
      title: 'Subtipo',
      dataIndex: 'subtype',
      key: 'subtype',
      width: 180,
      render: (_, row) => (
        <Select
          className="atlas-services-select"
          size="small"
          value={inlineEdit?.key === row.key && inlineEdit.field === 'subtype' ? inlineEdit.value : row.subtype}
          options={(DEFAULT_SUBTYPE_OPTIONS[row.serviceType] ?? []).map((item) => ({ label: item, value: item }))}
          style={{ width: '100%' }}
          onFocus={() => setInlineEdit({ key: row.key, field: 'subtype', value: row.subtype })}
          onChange={(value) => setInlineEdit({ key: row.key, field: 'subtype', value })}
          onBlur={() => saveInlineEdit(row)}
        />
      ),
    },
    {
      title: 'Situacao',
      dataIndex: 'situation',
      key: 'situation',
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Select
            className="atlas-services-select"
            size="small"
            value={inlineEdit?.key === row.key && inlineEdit.field === 'situation' ? inlineEdit.value : row.situation}
            options={(situationConfig[row.serviceType] ?? []).map((item) => ({ label: item.label, value: item.label }))}
            style={{ width: '100%' }}
            onFocus={() => setInlineEdit({ key: row.key, field: 'situation', value: row.situation })}
            onChange={(value) => setInlineEdit({ key: row.key, field: 'situation', value })}
            onBlur={() => saveInlineEdit(row)}
          />
          <Space size={[6, 6]} wrap>
            {(row.pendingConditions || []).filter((item) => !item.done).map((item) => (
              <Tag
                key={item.id}
                closable
                onClose={(event) => {
                  event.preventDefault();
                  void concludePendingCondition(row, item.id);
                }}
              >
                {item.label}
              </Tag>
            ))}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Tempo na situacao',
      key: 'situationDuration',
      width: 140,
      responsive: ['lg'],
      render: (_, row) => `${row.situationDurationDays} dia(s)`,
    },
    {
      title: 'Descricao',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      render: (_, row) => (
        <Input
          className="atlas-services-input"
          size="small"
          value={inlineEdit?.key === row.key && inlineEdit.field === 'description' ? inlineEdit.value : row.description}
          placeholder="Descricao livre"
          onFocus={() => setInlineEdit({ key: row.key, field: 'description', value: row.description })}
          onChange={(event) => setInlineEdit({ key: row.key, field: 'description', value: event.target.value })}
          onBlur={() => saveInlineEdit(row)}
        />
      ),
    },
    {
      title: 'Valor do contrato',
      dataIndex: 'contractValue',
      key: 'contractValue',
      width: 150,
      responsive: ['lg'],
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Data do contrato',
      dataIndex: 'contractDate',
      key: 'contractDate',
      width: 130,
      responsive: ['xl'],
      render: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Condicao de pagamento',
      dataIndex: 'paymentCondition',
      key: 'paymentCondition',
      width: 180,
      responsive: ['xxl'],
    },
    {
      title: 'A receber',
      dataIndex: 'receivable',
      key: 'receivable',
      width: 140,
      responsive: ['xl'],
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Recebido',
      dataIndex: 'received',
      key: 'received',
      width: 140,
      responsive: ['xxl'],
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Custos',
      dataIndex: 'costs',
      key: 'costs',
      width: 140,
      responsive: ['xxl'],
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Acoes',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button className="atlas-services-button" size="small" icon={<EditOutlined />} onClick={() => void openDrawer(row)}>
            Detalhes
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="atlas-services-page" style={{ maxWidth: 1600, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painel de Acompanhamento' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <Space direction="vertical" size={2}>
          <Title level={2} style={{ margin: 0 }}>Tela de Servicos</Title>
          <Text type="secondary">
            Acompanhamento unificado de CLCB, AVCB, Obras e Processos Administrativos.
          </Text>
        </Space>

        <Space wrap>
          <Button
            className="atlas-services-button"
            icon={<PlusOutlined />}
            onClick={() => navigate(typeFilter === 'ALL' ? '/cadastros/servicos' : `/cadastros/servicos?tipo=${typeFilter}`)}
          >
            Novo servico
          </Button>
          <Button className="atlas-services-button" icon={<SettingOutlined />} onClick={() => void openSettings()}>Configurar situacoes</Button>
        </Space>
      </div>

      <Card className="atlas-services-filter-card" style={{ borderRadius: 14, marginBottom: 20 }} styles={{ body: { padding: 16 } }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Select
              className="atlas-services-select"
              value={typeFilter}
              options={[{ label: 'Todos os tipos', value: 'ALL' }, ...SERVICE_TYPE_OPTIONS]}
              onChange={(value) => setTypeFilter(value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={10}>
            <Input
              className="atlas-services-input"
              placeholder="Buscar por codigo, cliente, telefone, subtipo ou situacao"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </Col>
          <Col xs={24} md={6} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Tag className="atlas-dashboard-meta-chip" bordered={false}>
              {filteredRows.length} servico(s)
            </Tag>
          </Col>
        </Row>
      </Card>

      <Card className="atlas-services-table-card" style={{ borderRadius: 14 }} styles={{ body: { padding: 0 } }}>
        <ExcelLikeTable
          tableId="acompanhamento-servicos"
          className="atlas-services-table"
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={filteredRows}
          tableLayout="auto"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} servico(s)`,
          }}
          onRow={(record) => ({
            onDoubleClick: () => void openDrawer(record),
          })}
        />
      </Card>

      <Drawer
        className="atlas-services-drawer"
        open={Boolean(drawerRow)}
        onClose={() => setDrawerRow(null)}
        width={820}
        title={drawerRow ? `${drawerRow.code} - ${drawerRow.clientName}` : 'Servico'}
      >
        {drawerRow ? (
          <Tabs
            items={[
              {
                key: 'cadastro',
                label: 'Cadastro',
                children: (
                  <Form layout="vertical" form={drawerForm} onFinish={saveDrawer}>
                    {(() => {
                      const availableSituations = (situationConfig[drawerRow.serviceType] ?? []).map((item) => ({ label: item.label, value: item.label }));
                      const hasPending = (drawerRow.pendingConditions || []).some((item) => !item.done);

                      return (
                        <>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="clientName" label="Nome do cliente" rules={[{ required: true }]}>
                                <Input className="atlas-services-input" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="phone" label="Telefone" normalize={normalizePhoneBR}>
                                <Input className="atlas-services-input" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="serviceType" label="Tipo de servico" rules={[{ required: true }]}>
                                <Select className="atlas-services-select" options={SERVICE_TYPE_OPTIONS} disabled />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="subtype" label="Subtipo">
                                <Input className="atlas-services-input" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="situation" label="Situacao" rules={[{ required: true }]}>
                                <Select className="atlas-services-select" options={availableSituations} disabled={hasPending} />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Space size={[6, 6]} wrap>
                                {(drawerRow.pendingConditions || []).filter((item) => !item.done).map((item) => (
                                  <Tag
                                    key={item.id}
                                    closable
                                    onClose={(event) => {
                                      event.preventDefault();
                                      void concludePendingCondition(drawerRow, item.id);
                                    }}
                                  >
                                    {item.label}
                                  </Tag>
                                ))}
                                {(drawerRow.pendingConditions || []).filter((item) => !item.done).length
                                  ? <Text type="secondary">Conclua as pendencias para liberar troca de situacao.</Text>
                                  : null}
                              </Space>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="contractDate" label="Data do contrato">
                                <DatePicker className="atlas-services-date" style={{ width: '100%' }} format="DD/MM/YYYY" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item name="description" label="Descricao">
                                <Input.TextArea className="atlas-services-input" rows={3} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="contractValue" label="Valor do contrato">
                                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="paymentCondition" label="Condicao de pagamento">
                                <Input className="atlas-services-input" />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="receivable" label="A receber">
                                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="received" label="Recebido">
                                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item name="costs" label="Custos">
                                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item name="folderUrl" label="Atalho da pasta">
                                <Input className="atlas-services-input" placeholder="https://... ou caminho da pasta" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Space wrap>
                            <Button className="atlas-services-button atlas-services-button-primary" type="primary" htmlType="submit" icon={<SaveOutlined />}>Salvar</Button>
                            <Button className="atlas-services-button" onClick={() => void openReportTemplateEditor()}>
                              Modelo PDF
                            </Button>
                            <Button className="atlas-services-button" icon={<FilePdfOutlined />} onClick={() => void exportRowPdf(drawerRow)}>Gerar PDF</Button>
                            {isInspectionSituation(drawerSituation) ? (
                              <Button className="atlas-services-button" icon={<CalendarOutlined />} onClick={openInspectionOnGoogleCalendar}>
                                Agendar vistoria
                              </Button>
                            ) : null}
                            <Button className="atlas-services-button" icon={<EditOutlined />} onClick={() => navigate(drawerRow.editPath)}>Abrir cadastro do painel</Button>
                            <Button className="atlas-services-button" onClick={() => navigate(`/cadastros/servicos?tipo=${drawerRow.serviceType}&codigo=${encodeURIComponent(drawerRow.code)}`)}>
                              Atalho: cadastro unico
                            </Button>
                            {drawerRow.folderUrl ? (
                              <Button className="atlas-services-button" icon={<FolderOpenOutlined />} onClick={() => window.open(drawerRow.folderUrl, '_blank', 'noopener,noreferrer')}>
                                Abrir pasta
                              </Button>
                            ) : null}
                          </Space>
                        </>
                      );
                    })()}
                  </Form>
                ),
              },
              {
                key: 'historico',
                label: 'Historico',
                children: (
                  <Timeline
                    items={(historyMap[drawerRow.key] ?? []).map((entry) => ({
                      children: (
                        <Space direction="vertical" size={2}>
                          <Text strong>{entry.previousSituation} → {entry.nextSituation}</Text>
                          <Text type="secondary">{dayjs(entry.changedAt).format('DD/MM/YYYY HH:mm')} • {entry.responsible}</Text>
                          <Text>{htmlToPlainText(entry.description) || 'Sem descricao registrada.'}</Text>
                        </Space>
                      ),
                    }))}
                  />
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>

      <Modal
        className="atlas-services-modal"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={null}
        width={760}
        title="Configuracao de situacoes por tipo de servico"
      >
        <Tabs
          items={SERVICE_TYPE_OPTIONS.map((serviceType) => ({
            key: serviceType.value,
            label: serviceType.label,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {(situationConfig[serviceType.value] ?? []).map((item) => (
                  <div key={item.id} style={{ padding: 10, border: '1px solid #dbe7f6', borderRadius: 12, background: '#f8fbff' }}>
                    <Row gutter={8} align="middle">
                      <Col flex="auto">
                        <Input
                          className="atlas-services-input"
                          value={item.label}
                          onChange={(event) => {
                            setSituationConfig((current) => ({
                              ...current,
                              [serviceType.value]: current[serviceType.value].map((currentItem) => (
                                currentItem.id === item.id
                                  ? { ...currentItem, label: event.target.value.toUpperCase() }
                                  : currentItem
                              )),
                            }));
                          }}
                          onBlur={() => void updateSituationItem(
                            serviceType.value,
                            {
                              ...item,
                              label: situationConfig[serviceType.value].find((currentItem) => currentItem.id === item.id)?.label || item.label,
                            },
                            {},
                            'Situacao atualizada.'
                          )}
                        />
                      </Col>
                      <Col>
                        <Button
                          type={item.isDefault ? 'primary' : 'default'}
                          onClick={() => void updateSituationItem(serviceType.value, item, { isDefault: true }, 'Situacao inicial atualizada.')}
                        >
                          Inicial
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          danger
                          onClick={() => void deleteSituation(item)}
                        >
                          Excluir
                        </Button>
                      </Col>
                    </Row>

                    <div style={{ marginTop: 10 }}>
                      <Text strong>Pendências</Text>
                      <Space size={[6, 6]} wrap style={{ marginTop: 6 }}>
                        {(item.conditions || []).filter((cond) => cond.active !== false).map((cond) => (
                          <Tag
                            key={cond.id}
                            closable
                            onClose={(event) => {
                              event.preventDefault();
                              void deleteCondition(cond.id);
                            }}
                            onClick={() => openEditCondition(serviceType.value, item, cond)}
                            style={{ cursor: 'pointer' }}
                          >
                            {cond.label}
                          </Tag>
                        ))}
                        <Button type="link" onClick={() => openCreateCondition(serviceType.value, item)}>
                          + Adicionar pendência
                        </Button>
                      </Space>
                    </div>
                  </div>
                ))}

                <Button
                  className="atlas-services-button"
                  loading={settingsLoading}
                  icon={<PlusOutlined />}
                  onClick={() => void addSituation(serviceType.value)}
                >
                  Adicionar situacao
                </Button>
              </Space>
            ),
          }))}
        />
      </Modal>

      <Modal
        className="atlas-services-modal"
        open={conditionModalOpen}
        onCancel={() => {
          setConditionModalOpen(false);
          setConditionEditing(null);
          conditionForm.resetFields();
        }}
        footer={null}
        title={conditionEditing?.condition ? 'Editar pendência' : 'Nova pendência'}
      >
        <Form form={conditionForm} layout="vertical" onFinish={saveCondition}>
          <Form.Item name="label" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input className="atlas-services-input" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="order" label="Ordem (opcional)">
                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="active" label=" " valuePropName="checked">
                <Checkbox>Ativa</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Space wrap>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Salvar</Button>
            {conditionEditing?.condition?.id ? (
              <Button danger onClick={() => void deleteCondition(conditionEditing.condition!.id)}>
                Excluir
              </Button>
            ) : null}
          </Space>
        </Form>
      </Modal>

      <Modal
        className="atlas-services-modal"
        open={reportTemplateModalOpen}
        onCancel={() => setReportTemplateModalOpen(false)}
        onOk={() => void saveReportTemplate()}
        okText="Salvar template"
        cancelText="Cancelar"
        confirmLoading={reportTemplateLoading}
        width={960}
        title="Modelo de PDF: Relatório do acompanhamento"
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Text type="secondary">
            Placeholders: {'{{code}}'}, {'{{client_name}}'}, {'{{pending_conditions}}'}, etc.
          </Text>
          <Input
            className="atlas-services-input"
            placeholder="Nome do template"
            value={reportTemplateName}
            onChange={(event) => setReportTemplateName(event.target.value)}
          />
          <Input.TextArea
            className="atlas-services-input"
            rows={18}
            placeholder="<html>...</html>"
            value={reportTemplateHtml}
            onChange={(event) => setReportTemplateHtml(event.target.value)}
          />
        </Space>
      </Modal>

      <Modal
        className="atlas-services-modal"
        open={inspectionModalOpen}
        onCancel={() => setInspectionModalOpen(false)}
        title="Agendar vistoria no Google"
        okText="Abrir Google Agenda"
        cancelText="Cancelar"
        onOk={confirmInspectionSchedule}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            Selecione a data/hora e abra o evento no Google Agenda. O agendamento fica salvo localmente neste navegador.
          </Text>
          <div>
            <Text strong>Data e horario</Text>
            <DatePicker
              className="atlas-services-date"
              style={{ width: '100%', marginTop: 6 }}
              showTime
              format="DD/MM/YYYY HH:mm"
              value={inspectionDraftStart}
              onChange={(value) => setInspectionDraftStart(value)}
            />
          </div>
          <div>
            <Text strong>Local (opcional)</Text>
            <Input
              className="atlas-services-input"
              style={{ marginTop: 6 }}
              value={inspectionDraftLocation}
              onChange={(event) => setInspectionDraftLocation(event.target.value)}
              placeholder="Ex: Endereco da vistoria"
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};
