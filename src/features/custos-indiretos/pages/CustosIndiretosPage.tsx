/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Typography,
  Space,
  App,
  Drawer,
  Upload,
  Table,
  DatePicker,
  Input,
  InputNumber,
  Select,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CustosIndiretosTable } from '../components/CustosIndiretosTable';
import type { CustoIndireto } from '../components/CustosIndiretosTable';
import { CustosIndiretosFilters } from '../components/CustosIndiretosFilters';
import { MetricTrendCards, type MetricTrendCardDefinition } from '../../../shared/components/charts/MetricTrendCards';
import { useMetricCardFilters } from '../../../shared/hooks/useMetricCardFilters';
import { custosIndiretosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { buildFilteredSeries, pickNumericValue, toSeriesRecords } from '../../../shared/utils/metricSeries';
import apiClient from '../../../core/api/apiClient';
import { parseCsvToRecords, toNumber } from '../../../core/import-export/csv';
import { useCsvExport } from '../../../core/import-export/hooks';
import { htmlToPlainText } from '../../../core/utils/text';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

type ImportRow = {
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: string;
  valor: number;
};

const parseBrDateToIso = (raw: string): string | null => {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const formatIsoToBrDate = (iso: string) => {
  const value = String(iso ?? '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [yyyy, mm, dd] = value.slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
};

export const CustosIndiretosPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [custos, setCustos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);

  const { exportRows, exporting } = useCsvExport<CustoIndireto>({
    filename: `custos-indiretos-${new Date().toISOString().slice(0, 10)}`,
    columns: ['Data', 'Descrição', 'Categoria', 'Valor'],
    mapData: (item) => ({
      Data: formatIsoToBrDate(item.data),
      Descrição: htmlToPlainText(item.descricao ?? ''),
      Categoria: item.categoria ?? '',
      Valor: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.valor ?? 0)),
    }),
  });

  const cardIds = useMemo(() => ([
    'custos-indiretos-entradas',
    'custos-indiretos-total',
    'custos-indiretos-admin',
  ] as const), []);

  const {
    filters: chartFilters,
    setPeriod,
    setGrouping,
    setCustomRange,
  } = useMetricCardFilters(cardIds);

  const trendCards = useMemo<MetricTrendCardDefinition[]>(() => {
    const records = toSeriesRecords(custos);

    return [
      {
        id: 'custos-indiretos-entradas',
        title: 'Entradas de Custos',
        subtitle: 'Lançamentos mensais registrados',
        valueType: 'number',
        series: buildFilteredSeries(records, ['data', 'dataContrato'], () => 1, chartFilters['custos-indiretos-entradas']),
        color: '#3B82F6',
        icon: <FileTextOutlined />,
        filters: {
          ...chartFilters['custos-indiretos-entradas'],
          onPeriodChange: (value) => setPeriod('custos-indiretos-entradas', value),
          onGroupingChange: (value) => setGrouping('custos-indiretos-entradas', value),
          onCustomRangeChange: (value) => setCustomRange('custos-indiretos-entradas', value),
        },
      },
      {
        id: 'custos-indiretos-total',
        title: 'Custos Totais',
        subtitle: 'Saídas mensais consolidadas',
        valueType: 'currency',
        series: buildFilteredSeries(
          records,
          ['data', 'dataContrato'],
          (record) => pickNumericValue(record, ['valor', 'custos']),
          chartFilters['custos-indiretos-total'],
        ),
        color: '#F59E0B',
        icon: <WalletOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters['custos-indiretos-total'],
          onPeriodChange: (value) => setPeriod('custos-indiretos-total', value),
          onGroupingChange: (value) => setGrouping('custos-indiretos-total', value),
          onCustomRangeChange: (value) => setCustomRange('custos-indiretos-total', value),
        },
      },
      {
        id: 'custos-indiretos-admin',
        title: 'Custos Administrativos',
        subtitle: 'Despesas administrativas por mês',
        valueType: 'currency',
        series: buildFilteredSeries(
          records,
          ['data', 'dataContrato'],
          (record) => {
            const categoria = String(record.categoria ?? '').toLowerCase();
            return categoria.includes('administr') ? pickNumericValue(record, ['valor', 'custos']) : 0;
          },
          chartFilters['custos-indiretos-admin'],
        ),
        color: '#10B981',
        icon: <DollarCircleOutlined />,
        inverseTrend: true,
        filters: {
          ...chartFilters['custos-indiretos-admin'],
          onPeriodChange: (value) => setPeriod('custos-indiretos-admin', value),
          onGroupingChange: (value) => setGrouping('custos-indiretos-admin', value),
          onCustomRangeChange: (value) => setCustomRange('custos-indiretos-admin', value),
        },
      },
    ];
  }, [chartFilters, custos, setCustomRange, setGrouping, setPeriod]);

  const fetchCustos = useCallback(async (page = 1, pageSize = DEFAULT_PAGE_SIZE, currentFilters: any = {}) => {
    setLoading(true);
    try {
      const data = await custosIndiretosService.getAll({
        page: page - 1,
        size: pageSize,
        ...currentFilters,
      }) as any;

      if (data && data.content) {
        setCustos(data.content);
        setPagination({
          current: page,
          pageSize,
          total: data.totalElements,
        });
      } else {
        setCustos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar custos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCustos(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchCustos]);

  const handleTableChange = (newPagination: any) => {
    fetchCustos(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (values: any) => {
    const formattedFilters: any = { ...values };
    if (values.dataInicio) {
      formattedFilters.dataInicio = values.dataInicio.format('YYYY-MM-DD');
    }
    if (values.dataFim) {
      formattedFilters.dataFim = values.dataFim.format('YYYY-MM-DD');
    }
    setFilters(formattedFilters);
    fetchCustos(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchCustos(1, pagination.pageSize, {});
  };

  const handleDelete = async (id: number) => {
    try {
      await custosIndiretosService.delete(id);
      message.success('Custo indireto excluído com sucesso');
      fetchCustos(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error('Erro ao excluir custo: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/custos-indiretos/novo');
  };

  const handleEdit = (record: CustoIndireto) => {
    navigate(`/custos-indiretos/${record.id}/editar`);
  };

  const parseImportFile = async (file: File): Promise<ImportRow[]> => {
    const rawText = await file.text();
    const records = parseCsvToRecords(rawText);

    const normalizeKey = (key: string) =>
      key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const getValue = (record: Record<string, string>, ...candidates: string[]) => {
      const entries = Object.entries(record);
      const normalizedEntries = entries.map(([k, v]) => [normalizeKey(k), v] as const);
      for (const candidate of candidates) {
        const idx = normalizedEntries.findIndex(([k]) => k === candidate || k.includes(candidate));
        if (idx >= 0) return normalizedEntries[idx][1];
      }
      return '';
    };

    return records
      .map((record) => {
        const dataRaw = getValue(record, 'data', 'date');
        const descricaoRaw = getValue(record, 'descricao', 'descri', 'historico', 'histor', 'description');
        const categoriaRaw = getValue(record, 'categoria', 'category');
        const valorRaw = getValue(record, 'valor', 'value', 'amount');

        const data = parseBrDateToIso(dataRaw);
        const descricao = String(descricaoRaw ?? '').trim();
        const categoria = String(categoriaRaw ?? '').trim() || 'Outros';
        const valor = toNumber(String(valorRaw ?? '0'));

        return {
          data: data ?? '',
          descricao,
          categoria,
          valor: Number.isFinite(valor) ? valor : 0,
        };
      })
      .filter((row) => row.data && row.descricao && row.valor > 0);
  };

  const handleImport = async () => {
    const rows = importRows
      .map((row) => ({
        data: row.data,
        descricao: row.descricao.trim(),
        categoria: row.categoria.trim(),
        valor: row.valor,
      }))
      .filter((row) => row.data && row.descricao && row.categoria && row.valor > 0);

    if (rows.length === 0) {
      message.error('Nenhuma linha válida para importar.');
      return;
    }

    setImporting(true);
    try {
      await apiClient.post('/custos-indiretos/import', { rows });
      message.success(`Importação concluída: ${rows.length} linha(s).`);
      setImportModalOpen(false);
      setImportRows([]);
      fetchCustos(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error(`Erro ao importar custos: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const importColumns = useMemo<ColumnsType<ImportRow>>(() => ([
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 150,
      render: (_, record, index) => (
        <DatePicker
          format="DD/MM/YYYY"
          value={record.data ? dayjs(record.data) : null}
          onChange={(value) => {
            const iso = value ? String(value.format('YYYY-MM-DD')) : '';
            setImportRows((prev) => prev.map((row, i) => (i === index ? { ...row, data: iso } : row)));
          }}
        />
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      render: (_, record, index) => (
        <Input
          value={record.descricao}
          onChange={(event) => {
            const value = event.target.value;
            setImportRows((prev) => prev.map((row, i) => (i === index ? { ...row, descricao: value } : row)));
          }}
        />
      ),
    },
    {
      title: 'Categoria',
      dataIndex: 'categoria',
      key: 'categoria',
      width: 220,
      render: (_, record, index) => (
        <Select
          value={record.categoria}
          onChange={(value) => {
            setImportRows((prev) => prev.map((row, i) => (i === index ? { ...row, categoria: value } : row)));
          }}
          style={{ width: '100%' }}
          options={[
            { value: 'Administrativo', label: 'Administrativo' },
            { value: 'Infraestrutura', label: 'Infraestrutura' },
            { value: 'Pessoal', label: 'Pessoal' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Outros', label: 'Outros' },
          ]}
          showSearch
          allowClear={false}
        />
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      width: 180,
      render: (_, record, index) => (
        <InputNumber
          value={record.valor}
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))}
          parser={(value) => toNumber(String(value ?? '0'))}
          onChange={(value) => {
            setImportRows((prev) => prev.map((row, i) => (i === index ? { ...row, valor: Number(value ?? 0) } : row)));
          }}
        />
      ),
    },
  ]), []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <Space orientation="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Custos Indiretos
          </Title>
          <Text type="secondary">Gerencie despesas administrativas e operacionais fixas.</Text>
        </Space>
        <Space wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportRows(custos)}
            loading={exporting}
            disabled={!custos.length}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Exportar CSV
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalOpen(true)}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Importar planilha
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleOpenAddPage}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Novo Custo
          </Button>
        </Space>
      </div>
  
      <CustosIndiretosFilters
        onSearch={handleSearch}
        onClear={handleClear}
      />

      <div className="mb-5">
        <MetricTrendCards cards={trendCards} loading={loading} />
      </div>


      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <CustosIndiretosTable
          dataSource={custos}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Drawer
        title="Importar custos indiretos"
        open={importModalOpen}
        placement="right"
        width={920}
        className="atlas-services-drawer"
        onClose={() => {
          setImportModalOpen(false);
          setImportRows([]);
        }}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              className="atlas-services-button"
              onClick={() => {
                setImportModalOpen(false);
                setImportRows([]);
              }}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              className="atlas-services-button atlas-services-button-primary"
              type="primary"
              onClick={() => void handleImport()}
              loading={importing}
              disabled={importRows.length === 0}
            >
              Importar
            </Button>
          </div>
        )}
        styles={{ body: { padding: 16 } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Text type="secondary">
            A importação lê CSV (preferencialmente com separador <Text code>;</Text>) e cria os custos no sistema.
            Colunas esperadas: <Text code>Data</Text>, <Text code>Descrição</Text>, <Text code>Categoria</Text>, <Text code>Valor</Text>.
          </Text>

          <Upload
            beforeUpload={async (file) => {
              const rows = await parseImportFile(file);
              if (rows.length === 0) {
                message.error('Nenhuma linha válida encontrada no arquivo.');
                setImportRows([]);
              } else {
                setImportRows(rows);
              }
              return false;
            }}
            maxCount={1}
            accept=".csv,.txt"
          >
            <Button icon={<UploadOutlined />}>Selecionar arquivo</Button>
          </Upload>

          <Table
            rowKey={(_, index) => String(index)}
            dataSource={importRows}
            columns={importColumns}
            pagination={false}
            scroll={{ x: 900, y: 520 }}
          />
        </Space>
      </Drawer>
    </div>
  );
};
