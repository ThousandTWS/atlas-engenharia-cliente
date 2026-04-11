import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd';
import {
  DownloadOutlined,
  ImportOutlined,
  InboxOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { useCsvExport } from '../../../core/import-export/hooks';
import { ExcelLikeTable } from '../../../shared/components/table/ExcelLikeTable';
import {
  financialLaunchService,
  type FinancialImportRow,
  type FinancialLaunch,
  type FinancialLaunchListResponse,
  type FinancialLaunchOrigin,
  type FinancialLaunchStatus,
  type FinancialLaunchType,
} from '../services/financialLaunchService';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const statusOptions: { label: string; value: FinancialLaunchStatus }[] = [
  { label: 'Previsto', value: 'PREVISTO' },
  { label: 'A pagar', value: 'A_PAGAR' },
  { label: 'Pago', value: 'PAGO' },
  { label: 'A confirmar', value: 'A_CONFIRMAR' },
];

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const normalizeDelimitedText = (content: string) => {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return '';
  }

  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  return lines.map((line) => line.replaceAll(delimiter, ',')).join('\n');
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseImportFile = async (file: File): Promise<FinancialImportRow[]> => {
  const fileName = file.name.toLowerCase();

  // Para arquivos Excel, tentar ler como CSV primeiro (muitos exports do Excel são CSV)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    throw new Error('Arquivos Excel (.xlsx, .xls) não são suportados diretamente. Salve como CSV primeiro.');
  }

  const rawText = await file.text();
  const content = normalizeDelimitedText(rawText);
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados.');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  const resolveIndex = (...candidates: string[]) =>
    headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate.toLowerCase())));

  const dateIndex = resolveIndex('data', 'date', 'dt', 'data_transacao');
  const descriptionIndex = resolveIndex('descricao', 'descrição', 'historico', 'histórico', 'description', 'desc', 'movimentacao');
  const valueIndex = resolveIndex('valor', 'amount', 'vlr', 'valor_transacao', 'credito', 'debito');
  const paymentIndex = resolveIndex('forma', 'metodo', 'método', 'payment', 'forma_pagamento', 'tipo');

  if (dateIndex === -1 && descriptionIndex === -1 && valueIndex === -1) {
    throw new Error('Não foi possível identificar as colunas necessárias (data, descrição, valor) no arquivo.');
  }

  const rows: FinancialImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCsvLine(line);

    // Extrair valor (suporte para diferentes formatos)
    const rawValue = String(columns[valueIndex] ?? '0').trim();
    const value = Number(rawValue.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));

    // Extrair data (suporte para diferentes formatos)
    const rawDate = String(columns[dateIndex] ?? '').trim();
    let date = dayjs();

    // Tentar diferentes formatos de data
    const dateFormats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'DD.MM.YYYY'];
    for (const format of dateFormats) {
      const parsed = dayjs(rawDate, format, true);
      if (parsed.isValid()) {
        date = parsed;
        break;
      }
    }

    const row: FinancialImportRow = {
      data: date.isValid() ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      descricao: String(columns[descriptionIndex] || '').trim() || 'Transação importada',
      valor: Number.isFinite(value) && value > 0 ? Math.abs(value) : 0,
      formaPagamento: String(columns[paymentIndex] || '').trim() || '',
      status: 'A_CONFIRMAR' as FinancialLaunchStatus,
      codigoServico: '',
      nomePrestador: '',
      observacao: '',
    };

    // Só adicionar se tiver valor válido
    if (row.valor > 0) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    throw new Error('Nenhuma transação válida encontrada no arquivo.');
  }

  return rows;
};

const statusColorMap: Record<FinancialLaunchStatus, string> = {
  PREVISTO: 'default',
  A_PAGAR: 'orange',
  PAGO: 'green',
  A_CONFIRMAR: 'blue',
};

export const LancamentosPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode } = useLayout();
  const [filtersForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<FinancialLaunchType>('ENTRADA');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FinancialLaunchListResponse>({
    content: [],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    resumo: { total: 0, pago: 0, aPagar: 0, previsto: 0 },
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importOrigin, setImportOrigin] = useState<FinancialLaunchOrigin>('IMPORT_INTER');
  const [importRows, setImportRows] = useState<FinancialImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const resumo = response.resumo || { total: 0, pago: 0, aPagar: 0, previsto: 0 };

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    try {
      const values = filtersForm.getFieldsValue();
      const period = values.periodo as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
      const data = await financialLaunchService.list({
        tipo: activeTab,
        busca: values.busca || undefined,
        status: values.status || undefined,
        formaPagamento: values.formaPagamento || undefined,
        codigoServico: values.codigoServico || undefined,
        dataInicio: period?.[0]?.format('YYYY-MM-DD'),
        dataFim: period?.[1]?.format('YYYY-MM-DD'),
        page: 0,
        size: 100,
      });
      setResponse(data);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('403')) {
        message.error('Sua sessão não foi reconhecida pelo backend. Faça login novamente para continuar.');
        navigate('/auth/login', { replace: true });
      } else {
        message.error(`Erro ao carregar lançamentos: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, filtersForm, message, navigate]);

  useEffect(() => {
    void fetchLancamentos();
  }, [fetchLancamentos]);

  const onDelete = useCallback(async (id: number) => {
    try {
      await financialLaunchService.remove(id);
      message.success('Lançamento removido.');
      void fetchLancamentos();
    } catch (error) {
      message.error(`Erro ao remover lançamento: ${(error as Error).message}`);
    }
  }, [fetchLancamentos, message]);

  const columns = useMemo<ColumnsType<FinancialLaunch>>(() => [
    {
      title: 'Data',
      dataIndex: 'data',
      width: 110,
      render: (value) => dayjs(value).format('DD/MM/YYYY'),
    },
    {
      title: activeTab === 'SAIDA' ? 'Prestador' : 'Cliente',
      key: 'person',
      render: (_, record) => record.nomePrestador || record.nomeCliente || '-',
    },
    {
      title: 'Serviço',
      dataIndex: 'codigoServico',
      render: (value) => value || '-',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
    },
    {
      title: 'Forma',
      dataIndex: 'formaPagamento',
      render: (value) => value || '-',
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value: FinancialLaunchStatus) => <Tag color={statusColorMap[value]}>{value.replaceAll('_', ' ')}</Tag>,
    },
    {
      title: 'Vinculado a',
      key: 'linkedTo',
      render: (_, record) => {
        if (record.codigoServico && record.nomePrestador) {
          return `${record.codigoServico} / ${record.nomePrestador}`;
        }

        return record.codigoServico || record.nomePrestador || '-';
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/lancamentos/${record.id}/editar?tipo=${record.tipo}`)}>Editar</Button>
          <Button size="small" danger onClick={() => void onDelete(record.id)}>Excluir</Button>
        </Space>
      ),
    },
  ], [activeTab, navigate, onDelete]);

  const { exportRows, exporting } = useCsvExport<FinancialLaunch>({
    filename: `lancamentos-${activeTab.toLowerCase()}`,
    columns: ['data', 'codigoServico', 'nomeCliente', 'nomePrestador', 'descricao', 'formaPagamento', 'valor', 'status'],
    mapData: (item) => ({
      data: dayjs(item.data).format('DD/MM/YYYY'),
      codigoServico: item.codigoServico || '',
      nomeCliente: item.nomeCliente || '',
      nomePrestador: item.nomePrestador || '',
      descricao: item.descricao,
      formaPagamento: item.formaPagamento || '',
      valor: item.valor,
      status: item.status,
    }),
  });

  const importColumns: ColumnsType<FinancialImportRow> = [
    {
      title: 'Data',
      dataIndex: 'data',
      render: (_, record, index) => (
        <DatePicker
          value={record.data ? dayjs(record.data) : null}
          onChange={(value) => {
            const next = [...importRows];
            next[index] = { ...record, data: value ? value.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') };
            setImportRows(next);
          }}
        />
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      render: (_, record, index) => (
        <Input
          value={record.descricao}
          onChange={(event) => {
            const next = [...importRows];
            next[index] = { ...record, descricao: event.target.value };
            setImportRows(next);
          }}
        />
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      render: (_, record, index) => (
        <Input
          value={String(record.valor)}
          onChange={(event) => {
            const next = [...importRows];
            next[index] = { ...record, valor: Number(event.target.value.replace(',', '.')) || 0 };
            setImportRows(next);
          }}
        />
      ),
    },
    {
      title: 'Forma',
      dataIndex: 'formaPagamento',
      render: (_, record, index) => (
        <Input
          value={record.formaPagamento}
          onChange={(event) => {
            const next = [...importRows];
            next[index] = { ...record, formaPagamento: event.target.value };
            setImportRows(next);
          }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record, index) => (
        <Select
          style={{ width: 140 }}
          value={record.status}
          options={statusOptions}
          onChange={(value) => {
            const next = [...importRows];
            next[index] = { ...record, status: value };
            setImportRows(next);
          }}
        />
      ),
    },
    {
      title: 'Código serviço',
      dataIndex: 'codigoServico',
      render: (_, record, index) => (
        <Input
          value={record.codigoServico}
          onChange={(event) => {
            const next = [...importRows];
            next[index] = { ...record, codigoServico: event.target.value };
            setImportRows(next);
          }}
        />
      ),
    },
    {
      title: 'Prestador',
      dataIndex: 'nomePrestador',
      render: (_, record, index) => (
        <Input
          value={record.nomePrestador}
          onChange={(event) => {
            const next = [...importRows];
            next[index] = { ...record, nomePrestador: event.target.value };
            setImportRows(next);
          }}
        />
      ),
    },
  ];

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      await financialLaunchService.importBatch({
        origem: importOrigin,
        tipo: activeTab,
        rows: importRows,
      });
      message.success('Lançamentos importados com sucesso.');
      setImportModalOpen(false);
      setImportRows([]);
      void fetchLancamentos();
    } catch (error) {
      message.error(`Erro ao importar lançamentos: ${(error as Error).message}`);
    } finally {
      setImporting(false);
    }
  }, [activeTab, fetchLancamentos, importOrigin, importRows, message]);

  return (
    <div className="atlas-lancamentos-page" style={{ maxWidth: 1480, margin: '0 auto' }}>
      <Card className="atlas-lancamentos-hero" bordered={false} style={{ marginBottom: 24 }}>
        <div className="atlas-lancamentos-hero-grid">
          <div>
            <Text className="atlas-lancamentos-kicker">Financeiro</Text>
            <Title level={isMobile ? 3 : 2} style={{ margin: '10px 0 6px' }}>Lançamentos Financeiros</Title>
            <Text className="atlas-lancamentos-hero-copy">
              Duas frentes claras: entradas de recebimento e saídas de pagamento, com importação e vínculo manual linha a linha.
            </Text>
          </div>
          <div className="atlas-lancamentos-actions">
            <Button className="atlas-services-button atlas-services-button-primary" type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/lancamentos/novo?tipo=${activeTab}`)}>+ Novo</Button>
            <Button className="atlas-services-button" icon={<ImportOutlined />} onClick={() => { setImportOrigin('IMPORT_INTER'); setImportModalOpen(true); }}>Importar Inter</Button>
            <Button className="atlas-services-button" icon={<InboxOutlined />} onClick={() => { setImportOrigin('IMPORT_ASAAS'); setImportModalOpen(true); }}>Importar Asaas</Button>
            <Button className="atlas-services-button" icon={<DownloadOutlined />} loading={exporting} onClick={() => exportRows(response.content)}>Exportar</Button>
          </div>
        </div>
      </Card>

      <Card className="atlas-lancamentos-workbench" bordered={false}>
        <div className="atlas-lancamentos-topbar">
          <div>
            <Text className="atlas-lancamentos-section-label">Estrutura</Text>
            <Title level={4} style={{ margin: '4px 0 0' }}>
              {activeTab === 'ENTRADA' ? 'Entradas (recebimentos)' : 'Saídas (pagamentos)'}
            </Title>
          </div>
          <Tabs
            className="atlas-lancamentos-tabs"
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as FinancialLaunchType)}
            items={[
              { key: 'ENTRADA', label: 'Entradas' },
              { key: 'SAIDA', label: 'Saídas' },
            ]}
          />
        </div>

      <Card
        className="atlas-services-filter-card atlas-lancamentos-filter-card"
        bordered={false}
        style={{ marginBottom: 16, background: isDarkMode ? '#0A0F1C' : '#FAFBFC' }}
      >
        <Form className="atlas-lancamentos-filter-form" form={filtersForm} layout="vertical" onFinish={() => void fetchLancamentos()}>
          <div className="atlas-lancamentos-filter-grid">
            <div>
              <Form.Item name="busca" label="Busca livre">
                <Input className="atlas-services-input atlas-lancamentos-field" placeholder="Descrição, cliente, prestador..." />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="status" label="Status">
                <Select className="atlas-services-select atlas-lancamentos-field" allowClear placeholder="Selecione" options={statusOptions} />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="periodo" label="Período">
                <RangePicker className="atlas-services-date atlas-lancamentos-field" style={{ width: '100%' }} placeholder={['Data inicial', 'Data final']} />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="formaPagamento" label="Forma de pagamento">
                <Input className="atlas-services-input atlas-lancamentos-field" placeholder="PIX, boleto..." />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="codigoServico" label="Serviço">
                <Input className="atlas-services-input atlas-lancamentos-field" placeholder="Código do serviço" />
              </Form.Item>
            </div>
          </div>
          <Space className="atlas-lancamentos-filter-actions">
            <Button className="atlas-services-button atlas-services-button-primary" type="primary" htmlType="submit">Filtrar</Button>
            <Button className="atlas-services-button" onClick={() => { filtersForm.resetFields(); void fetchLancamentos(); }}>Limpar</Button>
          </Space>
        </Form>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}><Card className="atlas-lancamentos-summary-card atlas-lancamentos-summary-card-total" bordered={false}><Statistic title="Total" value={resumo.total} formatter={(value) => formatCurrency(Number(value))} /></Card></Col>
        <Col xs={24} md={6}><Card className="atlas-lancamentos-summary-card atlas-lancamentos-summary-card-paid" bordered={false}><Statistic title="Pago" value={resumo.pago} formatter={(value) => formatCurrency(Number(value))} /></Card></Col>
        <Col xs={24} md={6}><Card className="atlas-lancamentos-summary-card atlas-lancamentos-summary-card-open" bordered={false}><Statistic title="A pagar" value={resumo.aPagar} formatter={(value) => formatCurrency(Number(value))} /></Card></Col>
        <Col xs={24} md={6}><Card className="atlas-lancamentos-summary-card atlas-lancamentos-summary-card-forecast" bordered={false}><Statistic title="Previsto" value={resumo.previsto} formatter={(value) => formatCurrency(Number(value))} /></Card></Col>
      </Row>

      <Card className="atlas-lancamentos-table-shell" bordered={false} styles={{ body: { padding: 0 } }}>
        <div className="atlas-lancamentos-table-shell-header">
          <div>
            <Text className="atlas-lancamentos-section-label">Listagem</Text>
            <Title level={5} style={{ margin: '4px 0 0' }}>
              {activeTab === 'ENTRADA' ? 'Recebimentos cadastrados' : 'Pagamentos cadastrados'}
            </Title>
          </div>
          <Text type="secondary">{response.totalElements} registros</Text>
        </div>
        <ExcelLikeTable
          tableId={`lancamentos-financeiros-${activeTab}`}
          rowKey="id"
          loading={loading}
          dataSource={response.content}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 20 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}><strong>Totalizadores</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right"><strong>{formatCurrency(resumo.total)}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={2}><Tag color="green">Pago {formatCurrency(resumo.pago)}</Tag></Table.Summary.Cell>
                <Table.Summary.Cell index={3}><Tag color="orange">A pagar {formatCurrency(resumo.aPagar)}</Tag></Table.Summary.Cell>
                <Table.Summary.Cell index={4}><Tag>Previsto {formatCurrency(resumo.previsto)}</Tag></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
      </Card>

      <Drawer
        title={importOrigin === 'IMPORT_INTER' ? 'Importar arquivo do Inter' : 'Importar arquivo do Asaas'}
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
              Importar lançamentos
            </Button>
          </div>
        )}
        styles={{ body: { padding: 16 } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text type="secondary">
              Faça o download do extrato do {importOrigin === 'IMPORT_INTER' ? 'Inter' : 'Asaas'} e selecione o arquivo CSV/TXT.
              Os dados aparecerão na tabela abaixo para revisão e ajustes antes da importação.
            </Text>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: 4 }}>
              <strong>Formato esperado:</strong> Arquivo CSV com colunas de Data, Descrição/Valor.
              Cada linha será uma transação que pode ser editada antes de importar.
            </Text>
          </div>

          <Upload
            beforeUpload={async (file) => {
              try {
                const rows = await parseImportFile(file);
                setImportRows(rows);
                message.success(`${rows.length} linhas processadas do arquivo ${file.name}`);
              } catch (error) {
                message.error(`Erro ao processar arquivo: ${(error as Error).message}`);
              }
              return false;
            }}
            maxCount={1}
            accept=".csv,.txt,.xlsx,.xls"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Selecionar arquivo</Button>
          </Upload>

          {importRows.length > 0 && (
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                Dados importados ({importRows.length} transações)
              </Text>
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: 16, display: 'block' }}>
                Revise e ajuste os dados abaixo. Clique em "Importar lançamentos" quando estiver pronto.
              </Text>
            </div>
          )}

          <Table
            rowKey={(_, index) => String(index)}
            dataSource={importRows}
            columns={importColumns}
            pagination={false}
            scroll={{ x: 1100, y: 520 }}
            locale={{ emptyText: 'Nenhum dado importado ainda. Selecione um arquivo acima.' }}
          />
        </Space>
      </Drawer>
    </div>
  );
};
