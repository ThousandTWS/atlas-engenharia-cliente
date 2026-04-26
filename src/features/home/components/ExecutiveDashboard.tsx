import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Card, Col, DatePicker, Empty, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { Chart } from '@antv/g2';
import { CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import dayjs, { type Dayjs } from 'dayjs';
import { executiveDashboardService, type DashboardSummary, type DashboardValueByType } from '../services/executiveDashboardService';
import { formatCurrencyPtBr } from '../../../core/structural/flyweight/numberFormatterFlyweight';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const currency = (value: number) => formatCurrencyPtBr(value ?? 0, 2);
const number = (value: number) => new Intl.NumberFormat('pt-BR').format(value ?? 0);
const percent = (value: number) => `${(value ?? 0).toFixed(2)}%`;
const defaultRange = (): [Dayjs, Dayjs] => [dayjs().startOf('month'), dayjs().endOf('day')];
const statusChartPalette = ['#A67458', '#64748B', '#0F766E', '#B45309', '#7C3AED', '#DC2626'];

const formatStatusLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const financialCards = (summary: DashboardSummary) => [
  { key: 'receita', title: 'Receita contratada', value: currency(summary.financeiro.receitaContratada), accent: '#0f766e' },
  { key: 'recebido', title: 'Total recebido', value: currency(summary.financeiro.totalRecebido), accent: '#2563eb' },
  { key: 'aberto', title: 'A receber', value: currency(summary.financeiro.aReceberEmAberto), accent: '#b45309' },
  { key: 'custos', title: 'Custos totais', value: currency(summary.financeiro.custosTotais), accent: '#dc2626' },
  { key: 'lucro', title: 'Lucro líquido estimado', value: currency(summary.financeiro.lucroLiquidoEstimado), accent: '#7c3aed' },
  { key: 'margem', title: 'Margem', value: percent(summary.financeiro.margemPercentual), accent: '#1d4ed8' },
];

type SituationChartItem = {
  situacao: string;
  label: string;
  quantidade: number;
};

const SituationLineChart = ({ data, isDarkMode }: { data: SituationChartItem[]; isDarkMode: boolean }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chartData = data.map((item, index) => ({
      status: item.label,
      quantidade: item.quantidade,
      serie: 'Serviços',
      color: statusChartPalette[index % statusChartPalette.length],
    }));

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 280,
    });

    chart.options({
      type: 'view',
      data: chartData,
      theme: isDarkMode ? 'classicDark' : 'classic',
      marginTop: 18,
      marginRight: 28,
      marginBottom: 44,
      marginLeft: 46,
      scale: {
        color: {
          range: ['#22D3EE'],
        },
        y: {
          nice: true,
        },
      },
      axis: {
        x: {
          title: null,
          labelFontSize: 12,
          labelFill: isDarkMode ? '#9EB3D3' : '#64748B',
          line: true,
          lineStroke: isDarkMode ? '#456078' : '#CBD5E1',
          tick: false,
        },
        y: {
          title: null,
          labelFontSize: 12,
          labelFill: isDarkMode ? '#9EB3D3' : '#64748B',
          grid: true,
          gridStroke: isDarkMode ? '#355064' : '#E2E8F0',
          gridLineDash: [4, 4],
        },
      },
      legend: {
        color: {
          position: 'top',
          itemLabelFill: isDarkMode ? '#E2E8F0' : '#334155',
          marker: 'smooth',
        },
      },
      tooltip: {
        title: (item: SituationChartItem) => item.label,
        items: [{ channel: 'y', name: 'Quantidade', valueFormatter: (value: number) => number(value) }],
      },
      children: [
        {
          type: 'line',
          encode: { x: 'status', y: 'quantidade', color: 'serie', shape: 'smooth' },
          style: {
            lineWidth: 3,
            shadowColor: isDarkMode ? '#22D3EE55' : '#22D3EE33',
            shadowBlur: 12,
          },
        },
        {
          type: 'point',
          encode: { x: 'status', y: 'quantidade', color: 'serie', shape: 'point' },
          style: {
            r: 5,
            lineWidth: 2,
            stroke: isDarkMode ? '#173244' : '#FFFFFF',
          },
        },
      ],
    });

    chart.render();

    return () => {
      chart.destroy();
    };
  }, [data, isDarkMode]);

  return <div ref={containerRef} className="atlas-antv-line-chart" />;
};

const TicketDonutChart = ({ data, isDarkMode }: { data: DashboardValueByType[]; isDarkMode: boolean }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const total = data.reduce((sum, item) => sum + (item.valor || 0), 0);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chartData = data.map((item) => ({
      tipo: formatStatusLabel(item.tipo),
      valor: item.valor,
    }));

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 240,
    });

    chart.options({
      type: 'interval',
      data: chartData,
      theme: isDarkMode ? 'classicDark' : 'classic',
      coordinate: { type: 'theta', innerRadius: 0.68, outerRadius: 0.9 },
      transform: [{ type: 'stackY' }],
      encode: { y: 'valor', color: 'tipo' },
      scale: {
        color: {
          range: ['#2F80ED', '#18C7C7', '#F28C52', '#A67458', '#7C3AED', '#64748B'],
        },
      },
      legend: {
        color: {
          position: 'bottom',
          layout: { justifyContent: 'center' },
          itemLabelFill: isDarkMode ? '#D6E1F3' : '#334155',
          itemLabelFontSize: 12,
        },
      },
      tooltip: {
        items: [{
          channel: 'y',
          name: 'Ticket',
          valueFormatter: (value: number) => currency(value),
        }],
      },
      style: {
        inset: 1,
        radius: 8,
        stroke: isDarkMode ? '#141B2D' : '#FFFFFF',
        lineWidth: 3,
      },
    });

    chart.render();

    return () => {
      chart.destroy();
    };
  }, [data, isDarkMode]);

  if (data.length === 0) {
    return (
      <div className="atlas-ticket-donut-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Não há dados" />
      </div>
    );
  }

  return (
    <div className="atlas-ticket-donut">
      <div ref={containerRef} className="atlas-ticket-donut__chart" />
      <div className="atlas-ticket-donut__center">
        <span>Total</span>
        <strong>{currency(total)}</strong>
      </div>
    </div>
  );
};

type ReceivableColumnItem = {
  label: string;
  'Em 7 dias': number;
  'Em 30 dias': number;
  'Em atraso': number;
};

export const ExecutiveDashboard = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const loadSummary = async (nextRange: [Dayjs, Dayjs]) => {
    setLoading(true);
    try {
      const response = await executiveDashboardService.getSummary(
        nextRange[0].format('YYYY-MM-DD'),
        nextRange[1].format('YYYY-MM-DD'),
      );
      setSummary(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.toLowerCase().includes('timeout')) {
        message.error('Dashboard demorou para responder. Tente novamente em alguns segundos.');
      } else {
        message.error(`Erro ao carregar dashboard: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary(range);
  }, []);

  const forecastData = useMemo(() => summary?.contasReceber.previsaoCaixa60Dias.map((item) => ({
    ...item,
    label: dayjs(item.dataReferencia).format('DD/MM'),
  })) ?? [], [summary]);

  const receivableColumnData = useMemo<ReceivableColumnItem[]>(() => {
    if (!summary) return [];

    const points = forecastData.length > 0
      ? forecastData.filter((_, index) => index % Math.max(1, Math.ceil(forecastData.length / 6)) === 0).slice(0, 6)
      : [{ label: dayjs(summary.dataFinal).format('DD/MM'), valor: 0 }];

    const totalForecast = points.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 1;
    const sevenDays = summary.contasReceber.parcelasAVencerEm7Dias;
    const thirtyDays = summary.contasReceber.parcelasAVencerEm30Dias;
    const overdue = summary.contasReceber.parcelasEmAtraso;

    return points.map((item) => {
      const weight = (Number(item.valor) || 0) / totalForecast;
      return {
        label: item.label,
        'Em 7 dias': sevenDays * weight,
        'Em 30 dias': thirtyDays * weight,
        'Em atraso': overdue * weight,
      };
    });
  }, [forecastData, summary]);

  const situationData = summary?.carteira.servicosPorSituacao ?? [];
  const situationChartData = situationData.map((item) => ({
    ...item,
    label: formatStatusLabel(item.situacao),
  }));
  const providerRows = summary?.prestadores.topPrestadoresPorCusto ?? [];
  const payableRows = summary?.prestadores.aPagarPorPrestador ?? [];
  const bottleneckRows = summary?.operacional.etapasComMaiorGargalo ?? [];

  if (!summary) {
    return <Card loading={loading} style={{ minHeight: 420, borderRadius: 16 }} />;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 18, overflow: 'hidden' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={6}>
              <Tag className="atlas-dashboard-meta-chip atlas-dashboard-meta-chip-primary" bordered={false}>
                Painel executivo
              </Tag>
              <Title level={3} style={{ margin: 0 }}>Indicadores financeiros, operacionais e de carteira</Title>
              <Text type="secondary">
                Período de {dayjs(summary.dataInicial).format('DD/MM/YYYY')} até {dayjs(summary.dataFinal).format('DD/MM/YYYY')}.
              </Text>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <div className="atlas-dashboard-chart-filters atlas-dashboard-chart-filters-right">
              <RangePicker
                className="atlas-dashboard-filter-range"
                value={range}
                format="DD/MM/YYYY"
                size="middle"
                onChange={(value) => {
                  if (!value?.[0] || !value[1]) {
                    return;
                  }
                  setRange([value[0], value[1]]);
                }}
              />
              <Button
                className="atlas-dashboard-action-button"
                type="primary"
                loading={loading}
                onClick={() => void loadSummary(range)}
              >
                Atualizar
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {financialCards(summary).map((card) => (
          <Col xs={24} sm={12} xl={8} key={card.key}>
            <Card style={{ borderRadius: 16, borderTop: `4px solid ${card.accent}` }}>
              <Statistic title={card.title} value={card.value} valueStyle={{ fontSize: 24 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={14} className="atlas-equal-height-col">
          <Card title="Carteira de serviços" className="atlas-equal-height-card" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}><Statistic title="Ativos" value={summary.carteira.servicosAtivos} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={12} md={6}><Statistic title="Novos" value={summary.carteira.novosServicosNoPeriodo} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={12} md={6}><Statistic title="Concluídos" value={summary.carteira.concluidosNoPeriodo} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={12} md={6}><Statistic title="Cancelamento" value={summary.carteira.taxaCancelamentoPercentual} formatter={(value) => percent(Number(value))} /></Col>
            </Row>
            <div style={{ width: '100%', height: 280 }}>
              <SituationLineChart data={situationChartData} isDarkMode={isDarkMode} />
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={10} className="atlas-equal-height-col">
          <Card title="Ticket médio por tipo" className="atlas-equal-height-card" style={{ borderRadius: 16 }}>
            <TicketDonutChart data={summary.carteira.ticketMedioPorTipo} isDarkMode={isDarkMode} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={12} className="atlas-equal-height-col">
          <Card title="Contas a receber" className="atlas-equal-height-card" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={8}><Statistic title="Em 7 dias" value={summary.contasReceber.parcelasAVencerEm7Dias} formatter={(value) => currency(Number(value))} /></Col>
              <Col xs={24} md={8}><Statistic title="Em 30 dias" value={summary.contasReceber.parcelasAVencerEm30Dias} formatter={(value) => currency(Number(value))} /></Col>
              <Col xs={24} md={8}><Statistic title="Em atraso" value={summary.contasReceber.parcelasEmAtraso} formatter={(value) => currency(Number(value))} /></Col>
            </Row>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={receivableColumnData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? '#355064' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => currency(Number(value)).replace('R$', '').trim()} />
                  <Tooltip formatter={(value) => currency(Number(value))} />
                  <Bar dataKey="Em 7 dias" stackId="receivable" fill="#2F80ED" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Em 30 dias" stackId="receivable" fill="#18C7C7" />
                  <Bar dataKey="Em atraso" stackId="receivable" fill="#F28C52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12} className="atlas-equal-height-col">
          <Card title="Prestadores e custos" className="atlas-equal-height-card" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12}><Statistic title="Custos diretos" value={summary.prestadores.custosDiretosPeriodo} formatter={(value) => currency(Number(value))} /></Col>
              <Col xs={12}><Statistic title="Custos indiretos" value={summary.prestadores.custosIndiretosPeriodo} formatter={(value) => currency(Number(value))} /></Col>
            </Row>
            <Table
              size="small"
              rowKey="prestador"
              pagination={false}
              dataSource={providerRows}
              columns={[
                { title: 'Top prestadores por custo', dataIndex: 'prestador', key: 'prestador' },
                { title: 'Valor pago', dataIndex: 'valor', key: 'valor', align: 'right', render: (value: number) => currency(value) },
              ]}
            />
            <div style={{ height: 12 }} />
            <Table
              size="small"
              rowKey="prestador"
              pagination={false}
              dataSource={payableRows}
              columns={[
                { title: 'A pagar por prestador', dataIndex: 'prestador', key: 'prestador' },
                { title: 'Saldo', dataIndex: 'valor', key: 'valor', align: 'right', render: (value: number) => currency(value) },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={12} className="atlas-equal-height-col">
          <Card title="Desempenho operacional" className="atlas-equal-height-card" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={12}><Statistic title="Parados há +30 dias" value={summary.operacional.servicosParadosHaMaisDe30Dias} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={24} md={12}><Statistic title="Etapas monitoradas" value={summary.operacional.tempoMedioPorSituacao.length} formatter={(value) => number(Number(value))} /></Col>
            </Row>
            <Table
              size="small"
              rowKey="tipo"
              pagination={false}
              dataSource={summary.operacional.tempoMedioConclusaoPorTipo}
              columns={[
                { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
                { title: 'Dias médios até conclusão', dataIndex: 'valor', key: 'valor', align: 'right', render: (value: number) => `${value.toFixed(2)} dias` },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12} className="atlas-equal-height-col">
          <Card title="Etapas com maior gargalo" className="atlas-equal-height-card" style={{ borderRadius: 16 }}>
            <Table
              size="small"
              rowKey="situacao"
              pagination={false}
              dataSource={bottleneckRows}
              columns={[
                { title: 'Situação', dataIndex: 'situacao', key: 'situacao' },
                { title: 'Tempo médio', dataIndex: 'dias', key: 'dias', align: 'right', render: (value: number) => `${value.toFixed(2)} dias` },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
