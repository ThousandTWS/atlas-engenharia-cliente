/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
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
  Slider,
  Space,
  Tabs,
  Tag,
  Timeline,
  Upload,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  ImportOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../core/api/apiClient';
import { formatPhoneBR, normalizePhoneBR } from '../../../shared/utils/inputFormat';
import { htmlToPlainText } from '../../../core/utils/text';
import { ExcelLikeTable, type ExcelColumnType } from '../../../shared/components/table/ExcelLikeTable';
import { pdfTemplatesService } from '../../../core/services/pdf/pdfTemplatesService';
import { parseCsvToRecords, toNumber } from '../../../core/services/import-export/csv';
import { renderPdfTemplate, toSafeTextVar } from '../../../shared/utils/pdfTemplate';
import { PdfTemplateEditorModal } from '../../../shared/components/PdfTemplateEditorModal';
import { useLiveSubscription, type LiveEvent } from '../../../core/realtime/liveProvider';
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
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Dragger } = Upload;

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

type SpreadsheetImportField =
  | 'code'
  | 'serviceType'
  | 'subtype'
  | 'situation'
  | 'clientName'
  | 'phone'
  | 'description'
  | 'contractValue'
  | 'contractDate'
  | 'paymentCondition'
  | 'receivable'
  | 'received'
  | 'costs'
  | 'folderUrl'
  | 'entryDate'
  | 'companyDocument'
  | 'companyName'
  | 'contactName'
  | 'email'
  | 'companyAddress'
  | 'serviceAddress';

interface ParsedSpreadsheetRow {
  lineNumber: number;
  code: string;
  serviceType?: ServiceKind;
  subtype?: string;
  situation?: string;
  clientName?: string;
  phone?: string;
  description?: string;
  contractValue?: number;
  contractDate?: string;
  paymentCondition?: string;
  receivable?: number;
  received?: number;
  costs?: number;
  folderUrl?: string;
  entryDate?: string;
  companyDocument?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  companyAddress?: string;
  serviceAddress?: string;
  sheetName?: string;
}

interface ParsedSpreadsheetImport {
  parsedRows: ParsedSpreadsheetRow[];
  detectedFields: SpreadsheetImportField[];
  deduplicatedCount: number;
}

const normalizeHeaderKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const normalizeCode = (value: string) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();

const normalizeImportedCode = (value: string) => {
  const normalized = String(value || '')
    .replace(/\u00A0/g, ' ')
    .trim();
  if (!normalized) return '';
  if (/^\d+(\.0+)?$/.test(normalized)) {
    return normalized.replace(/\.0+$/, '');
  }
  return normalized;
};

const yieldToBrowser = async () => {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
};

const resolveSpreadsheetDate = (value: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;

  const dash = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dash) return `${dash[3]}-${dash[2]}-${dash[1]}`;

  const yearFirst = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (yearFirst) return `${yearFirst[1]}-${yearFirst[2]}-${yearFirst[3]}`;

  return '';
};

const resolveSpreadsheetDateFromAny = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  return resolveSpreadsheetDate(String(value));
};

const resolveServiceKind = (value: string): ServiceKind | undefined => {
  const normalized = normalizeHeaderKey(value).toUpperCase();
  if (!normalized) return undefined;
  if (normalized.includes('PROCESSO') || normalized.includes('PROCADM') || normalized.includes('ADM')) return 'PROCESSOS_ADM';
  if (normalized.includes('OBRA')) return 'OBRAS';
  if (normalized.includes('CLCB')) return 'CLCB';
  if (normalized.includes('AVCB')) return 'AVCB';
  return undefined;
};

const inferServiceKindFromCode = (code: string): ServiceKind | undefined => {
  const normalized = String(code || '').trim();
  if (!normalized) return undefined;
  if (normalized.startsWith('1.') || normalized.startsWith('1-')) return 'PROCESSOS_ADM';
  if (normalized.startsWith('2.') || normalized.startsWith('2-')) return 'OBRAS';
  if (normalized.startsWith('3.') || normalized.startsWith('3-')) return 'AVCB';
  if (normalized.startsWith('4.') || normalized.startsWith('4-')) return 'CLCB';
  return undefined;
};

const normalizeSituationForSource = (value?: string): 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO' => {
  const normalized = normalizeHeaderKey(String(value || ''));
  if (!normalized) return 'PENDENTE';
  if (normalized.includes('cancel')) return 'CANCELADO';
  if (normalized.includes('conclu') || normalized.includes('finaliz')) return 'CONCLUIDO';
  if (
    normalized.includes('andamento')
    || normalized.includes('aguar')
    || normalized.includes('agenda')
    || normalized.includes('analise')
    || normalized.includes('vistoria')
    || normalized.includes('protocol')
  ) {
    return 'EM_ANDAMENTO';
  }
  return 'PENDENTE';
};

const SPREADSHEET_FIELD_CANDIDATES: Record<SpreadsheetImportField, string[]> = {
  code: ['codigo', 'codigodoservico', 'codigoservico', 'codservico', 'servicocodigo', 'servicecode', 'code', 'cod', 'coluna1', 'numeroservico', 'numero'],
  serviceType: ['tiposervico', 'tipo', 'servico', 'servicetype'],
  subtype: ['subtipo', 'subtiposervico', 'subtype'],
  situation: ['situacao', 'status', 'etapa', 'fase'],
  clientName: ['cliente', 'nomecliente', 'razaosocial', 'nomeempresa'],
  phone: ['telefone', 'celular', 'fone', 'phone'],
  description: ['descricao', 'observacao', 'detalhes', 'description'],
  contractValue: ['valorcontrato', 'valor', 'contrato', 'valorservico'],
  contractDate: ['datacontrato', 'contratodata', 'dataassinatura'],
  paymentCondition: ['condicaopagamento', 'pagamento', 'formapagamento'],
  receivable: ['areceber', 'valorareceber', 'receber'],
  received: ['recebido', 'valorrecebido'],
  costs: ['custos', 'custo'],
  folderUrl: ['folderurl', 'pastalink', 'pastadrive', 'pasta', 'linkpasta'],
  entryDate: ['dataentrada', 'entrada'],
  companyDocument: ['cnpj', 'cpf', 'cpfcnpj', 'documentoempresa', 'documento'],
  companyName: ['empresa', 'nomeempresa', 'razaosocialempresa', 'nomedocliente'],
  contactName: ['contato', 'nomecontato', 'responsavel'],
  email: ['email', 'correioeletronico'],
  companyAddress: ['enderecoempresa', 'enderecocliente', 'endereco'],
  serviceAddress: ['enderecoservico', 'localservico', 'local'],
};

const INSPECTION_STORAGE_KEY = 'atlas.service_tracking.inspection_schedule';
const LEGACY_INSPECTION_STORAGE_KEY = 'prevent.service_tracking.inspection_schedule';
const SERVICES_CACHE_STORAGE_KEY = 'atlas.service_tracking.rows_cache_v1';
const SERVICES_CACHE_MAX_AGE_MS = 2 * 20 * 5000;

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

const readServicesRowsCache = (): UnifiedServiceRow[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SERVICES_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt: number; rows: UnifiedServiceRow[] };
    if (!parsed?.savedAt || !Array.isArray(parsed?.rows)) return [];
    if (Date.now() - Number(parsed.savedAt) > SERVICES_CACHE_MAX_AGE_MS) return [];
    return parsed.rows;
  } catch {
    return [];
  }
};

const writeServicesRowsCache = (rows: UnifiedServiceRow[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SERVICES_CACHE_STORAGE_KEY, JSON.stringify({
      savedAt: Date.now(),
      rows,
    }));
  } catch {
  }
};

const SITUATION_COLOR_STORAGE_KEY = 'atlas.service_tracking.situation_colors';
const PENDING_TAG_COLOR_STORAGE_KEY = 'atlas.service_tracking.pending_tag_color';

const readSituationColors = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SITUATION_COLOR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeSituationColors = (value: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SITUATION_COLOR_STORAGE_KEY, JSON.stringify(value));
};

const readPendingTagColor = (): string => {
  if (typeof window === 'undefined') return '#f59e0b';
  return window.localStorage.getItem(PENDING_TAG_COLOR_STORAGE_KEY) || '#f59e0b';
};

const writePendingTagColor = (value: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_TAG_COLOR_STORAGE_KEY, value);
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

const TRACKING_RESOURCE_CHANNELS = new Set([
  'resources.avcbs',
  'resources.clcbs',
  'resources.obras',
  'resources.processos_adm',
]);

const TRACKING_RESOURCES = new Set(['avcbs', 'clcbs', 'obras', 'processos_adm']);

const buildRowOriginIdentity = (input: { serviceType: ServiceKind; origemId: number | string }) =>
  `${input.serviceType}|${String(input.origemId)}`;

const EMPTY_SITUATION_CONFIG: ServiceSituationConfig = {
  AVCB: [],
  CLCB: [],
  OBRAS: [],
  PROCESSOS_ADM: [],
};
const INITIAL_SERVICES_LOAD_SIZE = 120;
const FULL_SERVICES_LOAD_SIZE = 500;

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
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [situationColors, setSituationColors] = useState<Record<string, string>>(() => readSituationColors());
  const [pendingTagColor, setPendingTagColor] = useState<string>(() => readPendingTagColor());
  const [rows, setRows] = useState<UnifiedServiceRow[]>([]);
  const [hiddenOriginIdentities, setHiddenOriginIdentities] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<ServiceKind | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importingSpreadsheet, setImportingSpreadsheet] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importPreviewRows, setImportPreviewRows] = useState<ParsedSpreadsheetRow[]>([]);
  const [detectedImportFields, setDetectedImportFields] = useState<SpreadsheetImportField[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    startedAt: 0,
    lastLine: 0,
    lastStatus: 'Aguardando início',
  });

  const getSituationColor = (serviceType: ServiceKind, situation: string) => {
    return situationColors[`${serviceType}|${situation}`] || '#2563eb';
  };

  const updateSituationColor = (serviceType: ServiceKind, situation: string, color: string) => {
    const next = {
      ...situationColors,
      [`${serviceType}|${situation}`]: color,
    };
    setSituationColors(next);
    writeSituationColors(next);
  };

  const updatePendingTagColor = (color: string) => {
    setPendingTagColor(color);
    writePendingTagColor(color);
  };
  const [situationConfig, setSituationConfig] = useState<ServiceSituationConfig>(EMPTY_SITUATION_CONFIG);
  const [historyMap, setHistoryMap] = useState<Record<string, ServiceHistoryEntry[]>>({});
  const [drawerRow, setDrawerRow] = useState<UnifiedServiceRow | null>(null);
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
  const realtimeReloadTimerRef = useRef<number | null>(null);

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

  const loadData = useCallback(async (options?: { size?: number; silent?: boolean }) => {
    const size = options?.size ?? FULL_SERVICES_LOAD_SIZE;
    const silent = Boolean(options?.silent);
    if (!silent) setLoading(true);
    try {
      const services = await servicesTrackingApi.getAll({ size });
      const mapped = services.content
        .map(mapServiceRow)
        .filter((row: UnifiedServiceRow) =>
          !hiddenOriginIdentities.has(buildRowOriginIdentity({ serviceType: row.serviceType, origemId: row.origemId }))
        );
      setRows(mapped);
      writeServicesRowsCache(mapped);
    } catch (error: any) {
      const errorMessage = String(error?.message || '');
      if (errorMessage.toLowerCase().includes('timeout')) {
        message.error('O painel de acompanhamento demorou para responder. Tente novamente em alguns segundos.');
      } else {
        message.error(`Erro ao carregar painel de acompanhamento: ${errorMessage}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hiddenOriginIdentities, message]);

  useEffect(() => {
    const cachedRows = readServicesRowsCache();
    if (cachedRows.length) {
      setRows(cachedRows);
    }
  }, []);

  useEffect(() => {
    void loadData({ size: INITIAL_SERVICES_LOAD_SIZE });
    const timer = window.setTimeout(() => {
      void loadData({ size: FULL_SERVICES_LOAD_SIZE, silent: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    void loadSituationConfig();
  }, [loadSituationConfig]);

  const scheduleRealtimeReload = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (realtimeReloadTimerRef.current !== null) {
      window.clearTimeout(realtimeReloadTimerRef.current);
    }

    realtimeReloadTimerRef.current = window.setTimeout(() => {
      realtimeReloadTimerRef.current = null;
      void loadData({ size: FULL_SERVICES_LOAD_SIZE, silent: true });
    }, 350);
  }, [loadData]);

  useLiveSubscription({
    channel: 'resources.*',
    types: ['created', 'updated', 'deleted'],
    callback: (event: LiveEvent) => {
      const channelMatch = TRACKING_RESOURCE_CHANNELS.has(event.channel);
      const metaResource = String(event.meta?.resource || '').toLowerCase();
      const metaMatch = TRACKING_RESOURCES.has(metaResource);
      if (!channelMatch && !metaMatch) return;
      scheduleRealtimeReload();
    },
  });

  useEffect(() => {
    return () => {
      if (realtimeReloadTimerRef.current !== null) {
        window.clearTimeout(realtimeReloadTimerRef.current);
      }
    };
  }, []);

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

  const filteredRowKeys = useMemo(() => filteredRows.map((row) => row.key), [filteredRows]);
  const allFilteredSelected = useMemo(() => {
    if (!filteredRowKeys.length) return false;
    const selected = new Set(selectedRowKeys.map((key) => String(key)));
    return filteredRowKeys.every((key) => selected.has(String(key)));
  }, [filteredRowKeys, selectedRowKeys]);

  const importProgressPercent = useMemo(() => {
    if (!importProgress.total) return 0;
    return Math.round((importProgress.current / importProgress.total) * 100);
  }, [importProgress.current, importProgress.total]);

  const importElapsedSeconds = useMemo(() => {
    if (!importProgress.startedAt) return 0;
    return Math.max(Math.floor((Date.now() - importProgress.startedAt) / 1000), 0);
  }, [importProgress.current, importProgress.startedAt]);

  const resolveFieldValue = (
    normalizedRow: Record<string, string>,
    field: SpreadsheetImportField,
    detectedMap: Partial<Record<SpreadsheetImportField, string>>
  ) => {
    const detectedKey = detectedMap[field];
    if (detectedKey && normalizedRow[detectedKey] !== undefined) {
      return String(normalizedRow[detectedKey] || '').trim();
    }
    return '';
  };

  const parseSpreadsheetRecords = async (records: Record<string, unknown>[]): Promise<ParsedSpreadsheetImport> => {
    if (!records.length) {
      throw new Error('A planilha está vazia.');
    }

    const headers = Object.keys(records[0] || {}).map(normalizeHeaderKey);
    const detectedMap: Partial<Record<SpreadsheetImportField, string>> = {};

    (Object.keys(SPREADSHEET_FIELD_CANDIDATES) as SpreadsheetImportField[]).forEach((field) => {
      const match = SPREADSHEET_FIELD_CANDIDATES[field].find((candidate) =>
        headers.some((header) => header === candidate || header.includes(candidate) || candidate.includes(header))
      );
      if (!match) return;
      const matchedHeader = headers.find((header) => header === match || header.includes(match) || match.includes(header));
      if (matchedHeader) detectedMap[field] = matchedHeader;
    });

    const detectedFields = Object.keys(detectedMap) as SpreadsheetImportField[];
    if (!detectedFields.length) {
      throw new Error('Não foi possível detectar colunas conhecidas. Verifique o cabeçalho da planilha.');
    }

    const parsedRows: ParsedSpreadsheetRow[] = [];

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const normalizedRow = Object.entries(record).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[normalizeHeaderKey(key)] = String(value ?? '').trim();
        return acc;
      }, {});

      const rawType = resolveFieldValue(normalizedRow, 'serviceType', detectedMap) || String(record.__sheetName || '');
      const rawCode = normalizeImportedCode(resolveFieldValue(normalizedRow, 'code', detectedMap));
      const parsedType = resolveServiceKind(rawType) || inferServiceKindFromCode(rawCode);

      const contractValueRaw = resolveFieldValue(normalizedRow, 'contractValue', detectedMap);
      const receivableRaw = resolveFieldValue(normalizedRow, 'receivable', detectedMap);
      const receivedRaw = resolveFieldValue(normalizedRow, 'received', detectedMap);
      const costsRaw = resolveFieldValue(normalizedRow, 'costs', detectedMap);

      const nextItem: ParsedSpreadsheetRow = {
        lineNumber: index + 2,
        code: rawCode,
        serviceType: parsedType,
        subtype: resolveFieldValue(normalizedRow, 'subtype', detectedMap) || undefined,
        situation: resolveFieldValue(normalizedRow, 'situation', detectedMap) || undefined,
        clientName: resolveFieldValue(normalizedRow, 'clientName', detectedMap) || undefined,
        phone: resolveFieldValue(normalizedRow, 'phone', detectedMap) || undefined,
        description: resolveFieldValue(normalizedRow, 'description', detectedMap) || undefined,
        contractValue: contractValueRaw ? toNumber(contractValueRaw) : undefined,
        contractDate: resolveSpreadsheetDateFromAny(record[detectedMap.contractDate || '']) || undefined,
        paymentCondition: resolveFieldValue(normalizedRow, 'paymentCondition', detectedMap) || undefined,
        receivable: receivableRaw ? toNumber(receivableRaw) : undefined,
        received: receivedRaw ? toNumber(receivedRaw) : undefined,
        costs: costsRaw ? toNumber(costsRaw) : undefined,
        folderUrl: resolveFieldValue(normalizedRow, 'folderUrl', detectedMap) || undefined,
        entryDate: resolveSpreadsheetDateFromAny(record[detectedMap.entryDate || '']) || undefined,
        companyDocument: resolveFieldValue(normalizedRow, 'companyDocument', detectedMap) || undefined,
        companyName: resolveFieldValue(normalizedRow, 'companyName', detectedMap) || undefined,
        contactName: resolveFieldValue(normalizedRow, 'contactName', detectedMap) || undefined,
        email: resolveFieldValue(normalizedRow, 'email', detectedMap) || undefined,
        companyAddress: resolveFieldValue(normalizedRow, 'companyAddress', detectedMap) || undefined,
        serviceAddress: resolveFieldValue(normalizedRow, 'serviceAddress', detectedMap) || undefined,
        sheetName: String(record.__sheetName || '') || undefined,
      };

      if (
        nextItem.code
        || nextItem.clientName
        || nextItem.companyName
        || nextItem.phone
        || nextItem.description
        || nextItem.contractValue
      ) {
        parsedRows.push(nextItem);
      }

      if (index > 0 && index % 250 === 0) {
        await yieldToBrowser();
      }
    }

    if (!parsedRows.length) {
      throw new Error('Nenhuma linha válida encontrada para importação.');
    }

    let deduplicatedCount = 0;
    const uniqueRows = new Map<string, ParsedSpreadsheetRow>();
    for (let index = 0; index < parsedRows.length; index += 1) {
      const item = parsedRows[index];
      const normalizedCode = normalizeCode(item.code || '');
      if (!normalizedCode) continue;
      const resolvedType = item.serviceType || inferServiceKindFromCode(item.code || '');
      if (!resolvedType) continue;
      const dedupeKey = `${resolvedType}|${normalizedCode}`;
      if (uniqueRows.has(dedupeKey)) {
        deduplicatedCount += 1;
      }
      uniqueRows.set(dedupeKey, item);
      if (index > 0 && index % 400 === 0) {
        await yieldToBrowser();
      }
    }

    const withoutDuplicates: ParsedSpreadsheetRow[] = [];
    for (let index = 0; index < parsedRows.length; index += 1) {
      const item = parsedRows[index];
      const normalizedCode = normalizeCode(item.code || '');
      if (!normalizedCode) {
        withoutDuplicates.push(item);
        continue;
      }
      const resolvedType = item.serviceType || inferServiceKindFromCode(item.code || '');
      if (!resolvedType) {
        withoutDuplicates.push(item);
        continue;
      }
      const dedupeKey = `${resolvedType}|${normalizedCode}`;
      if (uniqueRows.get(dedupeKey) === item) {
        withoutDuplicates.push(item);
      }
      if (index > 0 && index % 400 === 0) {
        await yieldToBrowser();
      }
    }

    return { parsedRows: withoutDuplicates, detectedFields, deduplicatedCount };
  };

  const parseSpreadsheetImport = async (content: string): Promise<ParsedSpreadsheetImport> => {
    const records = parseCsvToRecords(content);
    return parseSpreadsheetRecords(records);
  };

  const readExcelRecords = async (file: File) => {
    const toNormalizedRecords = (sheet: XLSX.WorkSheet, sheetName: string) => {
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });
      return records.map((item) => ({
        ...item,
        __sheetName: sheetName,
      }));
    };

    const extractRelevantSheetRecords = (workbook: XLSX.WorkBook) => {
      const preferredSheetNames = workbook.SheetNames.filter((name) => {
        const normalized = normalizeHeaderKey(name);
        return normalized.includes('processoadm')
          || normalized.includes('obras')
          || normalized.includes('avcb')
          || normalized.includes('clcb');
      });
      const selected = preferredSheetNames.length ? preferredSheetNames : workbook.SheetNames.slice(0, 1);
      if (!selected.length) throw new Error('A planilha Excel não possui abas.');
      return selected.flatMap((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return [];
        return toNormalizedRecords(sheet, sheetName);
      });
    };

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', dense: true, WTF: false });
      return extractRelevantSheetRecords(workbook);
    } catch (firstError: any) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let index = 0; index < bytes.length; index += 1) {
          binary += String.fromCharCode(bytes[index]);
        }
        const workbook = XLSX.read(binary, { type: 'binary', dense: true, WTF: false });
        return extractRelevantSheetRecords(workbook);
      } catch (secondError: any) {
        const errorMessage = String(secondError?.message || firstError?.message || '');
        if (errorMessage.includes('Unexpected record')) {
          throw new Error(
            'Este arquivo XLSB usa um formato binário não compatível com o parser atual. Salve como XLSX ou CSV e tente novamente.'
          );
        }
        throw secondError;
      }
    }
  };

  const replaceRow = (row: UnifiedServiceRow) => {
    setRows((current) => {
      const next = current.map((item) => item.key === row.key ? row : item);
      writeServicesRowsCache(next);
      return next;
    });
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

  const executeBulkDelete = async () => {
    if (!selectedRowKeys.length) {
      message.warning('Selecione ao menos um serviço para excluir.');
      return;
    }

    const selectedIds = new Set(selectedRowKeys.map((key) => Number(key)));
    const targets = rows.filter((row) => selectedIds.has(row.id));
    if (!targets.length) {
      message.warning('Nenhum serviço selecionado foi encontrado na lista atual.');
      setSelectedRowKeys([]);
      return;
    }

    Modal.confirm({
      title: 'Excluir serviços selecionados',
      content: `Confirma a exclusão de ${targets.length} serviço(s)? Esta ação não pode ser desfeita.`,
      okText: 'Excluir em massa',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        setBulkDeleting(true);

        try {
          await servicesTrackingApi.deleteBatch(targets.map((row) => row.id));

          const removedIdentities = new Set(
            targets.map((row) => buildRowOriginIdentity({ serviceType: row.serviceType, origemId: row.origemId }))
          );

          setHiddenOriginIdentities((current) => {
            const next = new Set(current);
            removedIdentities.forEach((identity) => next.add(identity));
            return next;
          });
          setRows((current) => {
            const next = current.filter((row) =>
              !removedIdentities.has(buildRowOriginIdentity({ serviceType: row.serviceType, origemId: row.origemId }))
            );
            writeServicesRowsCache(next);
            return next;
          });

          if (drawerRow && targets.some((target) => target.id === drawerRow.id)) {
            setDrawerRow(null);
          }

          setSelectedRowKeys([]);
          message.success(`Exclusão em massa concluída. Removidos: ${targets.length}.`);
        } catch (error: any) {
          message.error(error?.message || 'Erro ao excluir serviços selecionados.');
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  const toggleSelectFilteredRows = () => {
    if (!filteredRowKeys.length) return;
    setSelectedRowKeys((current) => {
      const currentSet = new Set(current.map((key) => String(key)));
      if (allFilteredSelected) {
        return current.filter((key) => !filteredRowKeys.includes(String(key)));
      }
      filteredRowKeys.forEach((key) => currentSet.add(String(key)));
      return Array.from(currentSet);
    });
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

  const handleSpreadsheetSelection = async (file: File) => {
    try {
      setImportProgress({
        current: 0,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        startedAt: 0,
        lastLine: 0,
        lastStatus: 'Arquivo carregado. Pronto para importar.',
      });
      const lowerName = file.name.toLowerCase();
      let parsed: ParsedSpreadsheetImport;

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.xlsb')) {
        const records = await readExcelRecords(file);
        parsed = await parseSpreadsheetRecords(records);
      } else {
        const text = await file.text();
        parsed = await parseSpreadsheetImport(text);
      }

      setImportFileName(file.name);
      setImportPreviewRows(parsed.parsedRows);
      setDetectedImportFields(parsed.detectedFields);
      if (parsed.deduplicatedCount > 0) {
        message.warning(
          `${parsed.parsedRows.length} linha(s) pronta(s). ${parsed.deduplicatedCount} duplicada(s) por código/tipo foram removidas automaticamente.`
        );
      } else {
        message.success(`${parsed.parsedRows.length} linha(s) pronta(s) para importação.`);
      }
    } catch (error: any) {
      setImportFileName('');
      setImportPreviewRows([]);
      setDetectedImportFields([]);
      setImportProgress({
        current: 0,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        startedAt: 0,
        lastLine: 0,
        lastStatus: 'Falha ao processar arquivo.',
      });
      message.error(error.message || 'Falha ao processar planilha.');
    }
    return false;
  };

  const createServiceInSourceModule = async (input: {
    type: ServiceKind;
    clientName: string;
    phone: string;
    subtype: string;
    description: string;
    serviceAddress?: string;
    companyAddress?: string;
    situation?: string;
    contractValue: number;
    contractDate: string;
    paymentCondition?: string;
    receivable?: number;
    received?: number;
    costs?: number;
  }) => {
    const situacao = normalizeSituationForSource(input.situation);
    const commonFinancial = {
      valorContrato: Number(input.contractValue || 0),
      dataContrato: input.contractDate,
      condicaoPagamento: input.paymentCondition || '',
      aReceber: Number(input.receivable || 0),
      recebido: Number(input.received || 0),
      custos: Number(input.costs || 0),
    };

    if (input.type === 'AVCB') {
      return apiClient.post('/avcbs', {
        situacao,
        descricaoSituacao: input.description || '',
        ...commonFinancial,
      });
    }

    if (input.type === 'CLCB') {
      const safeAddress = input.serviceAddress || input.companyAddress || 'Endereço não informado';
      return apiClient.post('/clcbs', {
        nomeCliente: input.clientName,
        endereco: safeAddress,
        telefone: input.phone || '',
        situacao,
        descricaoSituacao: input.description || '',
        ...commonFinancial,
      });
    }

    if (input.type === 'OBRAS') {
      const safeAddress = input.serviceAddress || input.companyAddress || 'Endereço não informado';
      return apiClient.post('/obras', {
        nomeCliente: input.clientName,
        endereco: safeAddress,
        telefone: input.phone || '',
        servico: input.subtype || 'Serviço importado',
        situacao,
        descricaoSituacao: input.description || '',
        ...commonFinancial,
      });
    }

    return apiClient.post('/processos-adm', {
      situacao,
      descricaoSituacao: input.description || '',
      nomeCliente: input.clientName,
      ...commonFinancial,
    });
  };

  const executeSpreadsheetImport = async () => {
    if (!importPreviewRows.length) {
      message.warning('Selecione uma planilha antes de importar.');
      return;
    }

    setImportingSpreadsheet(true);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const nowDate = dayjs().format('YYYY-MM-DD');
    const total = importPreviewRows.length;
    setImportProgress({
      current: 0,
      total,
      created: 0,
      updated: 0,
      skipped: 0,
      startedAt: Date.now(),
      lastLine: 0,
      lastStatus: 'Iniciando importação...',
    });

    try {
      const buildImportCaches = (currentRows: UnifiedServiceRow[]) => {
        const byIdentity = new Map<string, UnifiedServiceRow>();
        const byCode = new Map<string, UnifiedServiceRow | null>();
        currentRows.forEach((row) => {
          const normalizedCode = normalizeCode(row.code);
          if (!normalizedCode) return;
          byIdentity.set(`${row.serviceType}|${normalizedCode}`, row);
          const existingByCode = byCode.get(normalizedCode);
          if (existingByCode === undefined) {
            byCode.set(normalizedCode, row);
            return;
          }
          if (existingByCode !== null && existingByCode.id !== row.id) {
            byCode.set(normalizedCode, null);
          }
        });
        return { byIdentity, byCode };
      };

      const { byIdentity, byCode } = buildImportCaches(rows);

      for (const item of importPreviewRows) {
        try {
          const itemCode = normalizeCode(item.code || '');
          const resolvedType = item.serviceType || inferServiceKindFromCode(item.code || '');
          const existingByIdentity = itemCode && resolvedType ? byIdentity.get(`${resolvedType}|${itemCode}`) : undefined;
          const existingByCode = itemCode ? byCode.get(itemCode) : undefined;
          const existing = existingByIdentity || (existingByCode === null ? undefined : existingByCode);

          if (existing) {
            const nextSituation = item.situation || existing.situation;
            const nextRow: UnifiedServiceRow = {
              ...existing,
              serviceType: existing.serviceType,
              subtype: item.subtype || existing.subtype,
              clientName: item.clientName || existing.clientName,
              phone: item.phone ? formatPhoneBR(item.phone) : existing.phone,
              situation: nextSituation,
              description: item.description || existing.description,
              contractValue: item.contractValue ?? existing.contractValue,
              contractDate: item.contractDate || existing.contractDate,
              paymentCondition: item.paymentCondition || existing.paymentCondition,
              receivable: item.receivable ?? existing.receivable,
              received: item.received ?? existing.received,
              costs: item.costs ?? existing.costs,
              folderUrl: item.folderUrl || existing.folderUrl,
            };

            const hasSituationChange = nextSituation !== existing.situation;
            const hasOtherChanges =
              nextRow.serviceType !== existing.serviceType
              || nextRow.subtype !== existing.subtype
              || nextRow.clientName !== existing.clientName
              || nextRow.phone !== existing.phone
              || nextRow.description !== existing.description
              || nextRow.contractValue !== existing.contractValue
              || nextRow.contractDate !== existing.contractDate
              || nextRow.paymentCondition !== existing.paymentCondition
              || nextRow.receivable !== existing.receivable
              || nextRow.received !== existing.received
              || nextRow.costs !== existing.costs
              || nextRow.folderUrl !== existing.folderUrl;

            if (!hasSituationChange && !hasOtherChanges) {
              updated += 1;
              setImportProgress((prev) => ({
                ...prev,
                current: prev.current + 1,
                updated,
                lastLine: item.lineNumber,
                lastStatus: `Linha ${item.lineNumber}: sem alterações (mantida).`,
              }));
              continue;
            }

            let mapped: UnifiedServiceRow = existing;
            if (hasSituationChange) {
              const detail = await servicesTrackingApi.updateSituation(existing.id, nextSituation, 'Situação atualizada via importação de planilha.');
              mapped = mapServiceRow(detail.service);
            }

            if (hasOtherChanges) {
              const updatedRecord = await servicesTrackingApi.update(existing.id, toUpdatePayload({ ...mapped, ...nextRow }));
              mapped = mapServiceRow(updatedRecord);
            }

            const mappedCode = normalizeCode(mapped.code || '');
            if (mappedCode) {
              byIdentity.set(`${mapped.serviceType}|${mappedCode}`, mapped);
              byCode.set(mappedCode, mapped);
            }
            updated += 1;
            setImportProgress((prev) => ({
              ...prev,
              current: prev.current + 1,
              updated,
              lastLine: item.lineNumber,
              lastStatus: `Linha ${item.lineNumber}: atualizado.`,
            }));
            continue;
          }

          if (!resolvedType) {
            throw new Error('tipo de serviço não identificado. Informe a coluna de tipo ou um código com prefixo válido.');
          }
          const defaultSubtype = item.subtype || DEFAULT_SUBTYPE_OPTIONS[resolvedType][0] || 'GERAL';
          const resolvedClientName = item.clientName || item.companyName || 'Cliente importado';
          const resolvedContractDate = item.contractDate || item.entryDate || nowDate;
          const resolvedContractValue = Number(item.contractValue || 0);

          const createValidationIssues: string[] = [];
          if (!resolvedType) createValidationIssues.push('tipoServico');
          if (!resolvedClientName) createValidationIssues.push('nomeCliente');
          if (!resolvedContractDate) createValidationIssues.push('dataContrato');
          if (createValidationIssues.length) {
            throw new Error(`campos obrigatórios ausentes: ${createValidationIssues.join(', ')}`);
          }

          const createdRecord = await createServiceInSourceModule({
            type: resolvedType,
            clientName: resolvedClientName,
            phone: item.phone || '',
            subtype: defaultSubtype,
            description: item.description || item.situation || '',
            serviceAddress: item.serviceAddress,
            companyAddress: item.companyAddress,
            situation: item.situation,
            contractValue: resolvedContractValue,
            contractDate: resolvedContractDate,
            paymentCondition: item.paymentCondition || '',
            receivable: item.receivable ?? resolvedContractValue,
            received: item.received ?? 0,
            costs: item.costs ?? 0,
          });
          created += 1;
          setImportProgress((prev) => ({
            ...prev,
            current: prev.current + 1,
            created,
            lastLine: item.lineNumber,
            lastStatus: `Linha ${item.lineNumber}: criado (${createdRecord.data?.codigo || 'novo serviço'}).`,
          }));
        } catch (error: any) {
          skipped += 1;
          errors.push(`Linha ${item.lineNumber}: ${error.message || 'falha na importação.'}`);
          setImportProgress((prev) => ({
            ...prev,
            current: prev.current + 1,
            skipped,
            lastLine: item.lineNumber,
            lastStatus: `Linha ${item.lineNumber}: erro.`,
          }));
        }
      }

      await loadData();
      setImportModalOpen(false);
      setImportFileName('');
      setImportPreviewRows([]);
      setDetectedImportFields([]);

      if (errors.length) {
        message.warning(
          `Importação finalizada com alertas. Criados: ${created}, atualizados: ${updated}, ignorados: ${skipped}.`
        );
        Modal.info({
          title: 'Resumo da importação',
          width: 720,
          content: (
            <Space direction="vertical" size={6}>
              <Text>Criados: {created}</Text>
              <Text>Atualizados: {updated}</Text>
              <Text>Ignorados: {skipped}</Text>
              <Text type="secondary">Erros encontrados:</Text>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {errors.map((entry) => (
                  <Text key={entry} style={{ display: 'block' }}>{entry}</Text>
                ))}
              </div>
            </Space>
          ),
        });
      } else {
        message.success(`Importação concluída. Criados: ${created}, atualizados: ${updated}.`);
      }
    } finally {
      setImportingSpreadsheet(false);
      setImportProgress((prev) => ({
        ...prev,
        lastStatus: 'Importação finalizada.',
      }));
    }
  };

  const columns: ExcelColumnType<UnifiedServiceRow>[] = [
    {
      title: 'Codigo',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      sorter: (a, b) => a.code.localeCompare(b.code, 'pt-BR', { numeric: true, sensitivity: 'base' }),
      excel: { mode: 'list' },
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Nome do cliente',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 180,
      sorter: (a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR', { sensitivity: 'base' }),
      excel: { mode: 'list' },
    },
    {
      title: 'Telefone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      responsive: ['lg'],
      sorter: (a, b) => a.phone.localeCompare(b.phone, 'pt-BR', { sensitivity: 'base' }),
      excel: { mode: 'list' },
    },
    {
      title: 'Tipo de servico',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 150,
      sorter: (a, b) => a.serviceType.localeCompare(b.serviceType, 'pt-BR', { sensitivity: 'base' }),
      excel: { mode: 'list' },
      render: (value: ServiceKind) => value === 'PROCESSOS_ADM' ? 'Proc. Adm.' : value,
    },
    {
      title: 'Subtipo',
      dataIndex: 'subtype',
      key: 'subtype',
      width: 180,
      sorter: (a, b) => a.subtype.localeCompare(b.subtype, 'pt-BR', { sensitivity: 'base' }),
      excel: { mode: 'list' },
      render: (value: string) => <Text>{value || '-'}</Text>,
    },
    {
      title: 'Situacao',
      dataIndex: 'situation',
      key: 'situation',
      width: 180,
      sorter: (a, b) => a.situation.localeCompare(b.situation, 'pt-BR', { sensitivity: 'base' }),
      excel: { mode: 'list' },
      render: (_, row) => {
        const color = getSituationColor(row.serviceType, row.situation);
        return (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Select
              className="atlas-services-select atlas-services-select--status"
              size="small"
              value={inlineEdit?.key === row.key && inlineEdit.field === 'situation' ? inlineEdit.value : row.situation}
              options={(situationConfig[row.serviceType] ?? []).map((item) => ({ label: item.label, value: item.label }))}
              style={{ width: '100%', background: color, color: '#fff' }}
              onFocus={() => setInlineEdit({ key: row.key, field: 'situation', value: row.situation })}
              onChange={(value) => setInlineEdit({ key: row.key, field: 'situation', value })}
              onBlur={() => saveInlineEdit(row)}
            />
            <Space size={[6, 6]} wrap>
              {(row.pendingConditions || []).filter((item) => !item.done).map((item) => (
                <Tag
                  key={item.id}
                  closable
                  color={pendingTagColor}
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
        );
      },
    },
    {
      title: 'Tempo na situacao',
      key: 'situationDuration',
      width: 140,
      responsive: ['lg'],
      sorter: (a, b) => a.situationDurationDays - b.situationDurationDays,
      render: (_, row) => `${row.situationDurationDays} dia(s)`,
    },
    {
      title: 'Descricao',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      render: (value: string) => <Text ellipsis>{value || '-'}</Text>,
    },
    {
      title: 'Valor do contrato',
      dataIndex: 'contractValue',
      key: 'contractValue',
      width: 150,
      responsive: ['lg'],
      sorter: (a, b) => a.contractValue - b.contractValue,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Data do contrato',
      dataIndex: 'contractDate',
      key: 'contractDate',
      width: 130,
      responsive: ['xl'],
      sorter: (a, b) => dayjs(a.contractDate).valueOf() - dayjs(b.contractDate).valueOf(),
      render: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Condicao de pagamento',
      dataIndex: 'paymentCondition',
      key: 'paymentCondition',
      width: 180,
      responsive: ['xxl'],
      sorter: (a, b) => a.paymentCondition.localeCompare(b.paymentCondition, 'pt-BR', { sensitivity: 'base' }),
      excel: { mode: 'list' },
    },
    {
      title: 'A receber',
      dataIndex: 'receivable',
      key: 'receivable',
      width: 140,
      responsive: ['xl'],
      sorter: (a, b) => a.receivable - b.receivable,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Recebido',
      dataIndex: 'received',
      key: 'received',
      width: 140,
      responsive: ['xxl'],
      sorter: (a, b) => a.received - b.received,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Custos',
      dataIndex: 'costs',
      key: 'costs',
      width: 140,
      responsive: ['xxl'],
      sorter: (a, b) => a.costs - b.costs,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Acoes',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button className="atlas-services-button" size="small" icon={<EditOutlined />} onClick={() => void openDrawer(row)}>
            Detalhes
          </Button>
          {row.folderUrl ? (
            <Button
              className="atlas-services-button"
              size="small"
              icon={<FolderOpenOutlined />}
              onClick={() => window.open(row.folderUrl, '_blank', 'noopener,noreferrer')}
            >
              Pasta
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="atlas-services-page" style={{ maxWidth: 1600, margin: '0 auto' }}>
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
            disabled={!filteredRowKeys.length || bulkDeleting}
            onClick={toggleSelectFilteredRows}
          >
            {allFilteredSelected ? 'Desmarcar filtrados' : `Selecionar filtrados (${filteredRowKeys.length})`}
          </Button>
          <Button
            className="atlas-services-button"
            danger
            loading={bulkDeleting}
            disabled={!selectedRowKeys.length || bulkDeleting}
            onClick={() => void executeBulkDelete()}
          >
            Excluir selecionados ({selectedRowKeys.length})
          </Button>
          <Button
            className="atlas-services-button"
            icon={<ImportOutlined />}
            onClick={() => {
              setImportProgress({
                current: 0,
                total: 0,
                created: 0,
                updated: 0,
                skipped: 0,
                startedAt: 0,
                lastLine: 0,
                lastStatus: 'Aguardando arquivo.',
              });
              setImportModalOpen(true);
            }}
          >
            Importar planilha
          </Button>
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
            pageSize: 30,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} servico(s)`,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            preserveSelectedRowKeys: true,
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

      <Drawer
        className="atlas-services-drawer"
        open={importModalOpen}
        onClose={() => {
          if (importingSpreadsheet) return;
          setImportModalOpen(false);
        }}
        title="Importar serviços por planilha"
        placement="right"
        width={560}
        footer={(
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                if (importingSpreadsheet) return;
                setImportModalOpen(false);
              }}
              disabled={importingSpreadsheet}
            >
              Fechar
            </Button>
            <Button
              type="primary"
              loading={importingSpreadsheet}
              disabled={!importPreviewRows.length}
              onClick={() => void executeSpreadsheetImport()}
            >
              Importar agora
            </Button>
          </Space>
        )}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            O sistema detecta automaticamente as colunas e importa em lote. Linhas com código existente são atualizadas; as demais são criadas.
          </Text>

          {importingSpreadsheet || importProgress.total > 0 ? (
            <Card size="small">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text strong>Progresso da importação</Text>
                <Slider value={importProgressPercent} min={0} max={100} tooltip={{ open: false }} disabled />
                <Text>{importProgress.current}/{importProgress.total} linha(s) processada(s) • {importProgressPercent}%</Text>
                <Text type="secondary">
                  Criados: {importProgress.created} | Atualizados: {importProgress.updated} | Ignorados: {importProgress.skipped} | Tempo: {importElapsedSeconds}s
                </Text>
                <Text type="secondary">{importProgress.lastStatus}</Text>
              </Space>
            </Card>
          ) : null}

          <Dragger
            beforeUpload={handleSpreadsheetSelection}
            accept=".csv,.txt,.xls,.xlsx,.xlsb,application/vnd.ms-excel.sheet.binary.macroEnabled.12"
            showUploadList={false}
            disabled={importingSpreadsheet}
            multiple={false}
            maxCount={1}
            onDrop={(event) => {
              const count = event.dataTransfer?.files?.length || 0;
              if (count > 1) {
                message.info('Apenas a primeira planilha será utilizada.');
              }
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Clique ou arraste a planilha para esta área</p>
            <p className="ant-upload-hint">
              Formatos aceitos: CSV, XLS, XLSX e XLSB.
            </p>
            <Button icon={<UploadOutlined />} disabled={importingSpreadsheet}>
              Selecionar planilha
            </Button>
          </Dragger>

          {importFileName ? <Text strong>Arquivo: {importFileName}</Text> : null}
          {detectedImportFields.length ? (
            <Space size={[6, 6]} wrap>
              {detectedImportFields.map((field) => (
                <Tag key={field}>{field}</Tag>
              ))}
            </Space>
          ) : null}

          <Card size="small">
            <Text strong>Prévia da importação</Text>
            <div style={{ marginTop: 8 }}>
              <Text>{importPreviewRows.length} linha(s) válida(s) detectada(s).</Text>
            </div>
            <div style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
              {importPreviewRows.slice(0, 15).map((item) => (
                <Text key={`${item.lineNumber}-${item.code}-${item.clientName}`} style={{ display: 'block' }}>
                  Linha {item.lineNumber}: {item.code || 'SEM_CODIGO'} | {item.clientName || item.companyName || '-'} | {item.serviceType || '-'}
                </Text>
              ))}
            </div>
          </Card>
        </Space>
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
                        <Input
                          type="color"
                          value={getSituationColor(serviceType.value, item.label)}
                          onChange={(event) => updateSituationColor(serviceType.value, item.label, event.target.value)}
                          style={{ width: 64, padding: 0, height: 32, border: '1px solid #d9d9d9', borderRadius: 6 }}
                        />
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

                <Row align="middle" style={{ width: '100%', justifyContent: 'space-between', padding: '0 10px' }}>
                  <Text strong>Cor das pendências</Text>
                  <Input
                    type="color"
                    value={pendingTagColor}
                    onChange={(event) => updatePendingTagColor(event.target.value)}
                    style={{ width: 64, padding: 0, height: 32, border: '1px solid #d9d9d9', borderRadius: 6 }}
                  />
                </Row>

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

      <PdfTemplateEditorModal
        open={reportTemplateModalOpen}
        title="Modelo de PDF: Relatório do acompanhamento"
        confirmLoading={reportTemplateLoading}
        onCancel={() => setReportTemplateModalOpen(false)}
        onSave={() => void saveReportTemplate()}
        variant="drawer"
        templateName={reportTemplateName}
        templateHtml={reportTemplateHtml}
        onChangeName={setReportTemplateName}
        onChangeHtml={setReportTemplateHtml}
        helperText={<>Placeholders comuns: {'{{code}}'}, {'{{client_name}}'}, {'{{pending_conditions}}'}.</>}
        placeholders={[
          { key: 'code', label: 'Código', description: 'Identificador do serviço.' },
          { key: 'client_name', label: 'Cliente', description: 'Nome do cliente.' },
          { key: 'generated_at', label: 'Gerado em', description: 'Data/hora de geração.' },
          { key: 'service_type', label: 'Tipo', description: 'Tipo de serviço.' },
          { key: 'subtype', label: 'Subtipo', description: 'Subtipo do serviço.' },
          { key: 'situation', label: 'Situação', description: 'Situação no acompanhamento.' },
          { key: 'pending_conditions', label: 'Pendências', description: 'Pendências em aberto.' },
          { key: 'description', label: 'Descrição', description: 'Descrição/resumo.' },
          { key: 'phone', label: 'Telefone', description: 'Telefone do cliente.' },
          { key: 'contract_value', label: 'Contrato', description: 'Valor do contrato.' },
          { key: 'contract_date', label: 'Data contrato', description: 'Data do contrato.' },
          { key: 'payment_condition', label: 'Condição', description: 'Condição de pagamento.' },
          { key: 'receivable', label: 'A receber', description: 'Valor a receber.' },
          { key: 'received', label: 'Recebido', description: 'Valor recebido.' },
          { key: 'costs', label: 'Custos', description: 'Custos.' },
          { key: 'folder_url', label: 'Pasta', description: 'Link da pasta.' },
        ]}
        previewVariables={{
          code: toSafeTextVar('SRV-0001'),
          client_name: toSafeTextVar('Cliente Exemplo'),
          generated_at: toSafeTextVar(dayjs().format('DD/MM/YYYY HH:mm')),
          service_type: toSafeTextVar('AVCB'),
          subtype: toSafeTextVar('Renovação'),
          situation: toSafeTextVar('EM_ANDAMENTO'),
          pending_conditions: toSafeTextVar('Documentação, Vistoria'),
          description: toSafeTextVar('Resumo do acompanhamento do serviço.'),
          phone: toSafeTextVar('(11) 99999-9999'),
          contract_value: toSafeTextVar(formatCurrency(1200)),
          contract_date: toSafeTextVar(dayjs().format('DD/MM/YYYY')),
          payment_condition: toSafeTextVar('2x 30 dias'),
          receivable: toSafeTextVar(formatCurrency(1200)),
          received: toSafeTextVar(formatCurrency(600)),
          costs: toSafeTextVar(formatCurrency(200)),
          folder_url: toSafeTextVar('https://drive.google.com/...'),
        }}
      />

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
