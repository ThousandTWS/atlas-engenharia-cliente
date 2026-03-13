import { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Col, DatePicker, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dayjs, { type Dayjs } from 'dayjs';
import { executiveDashboardService, type DashboardSummary } from '../services/executiveDashboardService';
import { formatCurrencyPtBr } from '../../../core/structural/flyweight/numberFormatterFlyweight';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const currency = (value: number) => formatCurrencyPtBr(value ?? 0, 2);
const number = (value: number) => new Intl.NumberFormat('pt-BR').format(value ?? 0);
const percent = (value: number) => `${(value ?? 0).toFixed(2)}%`;
const defaultRange = (): [Dayjs, Dayjs] => [dayjs().startOf('month'), dayjs().endOf('day')];

const financialCards = (summary: DashboardSummary) => [
  { key: 'receita', title: 'Receita contratada', value: currency(summary.financeiro.receitaContratada), accent: '#0f766e' },
  { key: 'recebido', title: 'Total recebido', value: currency(summary.financeiro.totalRecebido), accent: '#2563eb' },
  { key: 'aberto', title: 'A receber', value: currency(summary.financeiro.aReceberEmAberto), accent: '#b45309' },
  { key: 'custos', title: 'Custos totais', value: currency(summary.financeiro.custosTotais), accent: '#dc2626' },
  { key: 'lucro', title: 'Lucro líquido estimado', value: currency(summary.financeiro.lucroLiquidoEstimado), accent: '#7c3aed' },
  { key: 'margem', title: 'Margem', value: percent(summary.financeiro.margemPercentual), accent: '#1d4ed8' },
];

export const ExecutiveDashboard = () => {
  const { message } = App.useApp();
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
      message.error(`Erro ao carregar dashboard: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

  const situationData = summary?.carteira.servicosPorSituacao ?? [];
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
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <RangePicker
                value={range}
                format="DD/MM/YYYY"
                onChange={(value) => {
                  if (!value?.[0] || !value[1]) {
                    return;
                  }
                  setRange([value[0], value[1]]);
                }}
              />
              <Button type="primary" loading={loading} onClick={() => void loadSummary(range)}>Atualizar</Button>
            </Space>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Carteira de serviços" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}><Statistic title="Ativos" value={summary.carteira.servicosAtivos} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={12} md={6}><Statistic title="Novos" value={summary.carteira.novosServicosNoPeriodo} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={12} md={6}><Statistic title="Concluídos" value={summary.carteira.concluidosNoPeriodo} formatter={(value) => number(Number(value))} /></Col>
              <Col xs={12} md={6}><Statistic title="Cancelamento" value={summary.carteira.taxaCancelamentoPercentual} formatter={(value) => percent(Number(value))} /></Col>
            </Row>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={situationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="situacao" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => number(Number(value))} />
                  <Bar dataKey="quantidade" radius={[10, 10, 0, 0]}>
                    {situationData.map((item, index) => (
                      <Cell key={`${item.situacao}-${index}`} fill={['#2563eb', '#0f766e', '#f59e0b', '#7c3aed', '#dc2626'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Ticket médio por tipo" style={{ borderRadius: 16 }}>
            <Table
              size="small"
              rowKey="tipo"
              pagination={false}
              dataSource={summary.carteira.ticketMedioPorTipo}
              columns={[
                { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
                { title: 'Ticket', dataIndex: 'valor', key: 'valor', align: 'right', render: (value: number) => currency(value) },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Contas a receber" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={8}><Statistic title="Em 7 dias" value={summary.contasReceber.parcelasAVencerEm7Dias} formatter={(value) => currency(Number(value))} /></Col>
              <Col xs={24} md={8}><Statistic title="Em 30 dias" value={summary.contasReceber.parcelasAVencerEm30Dias} formatter={(value) => currency(Number(value))} /></Col>
              <Col xs={24} md={8}><Statistic title="Em atraso" value={summary.contasReceber.parcelasEmAtraso} formatter={(value) => currency(Number(value))} /></Col>
            </Row>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => currency(Number(value))} />
                  <Area type="monotone" dataKey="valor" stroke="#2563eb" fill="url(#forecastFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Prestadores e custos" style={{ borderRadius: 16 }}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Desempenho operacional" style={{ borderRadius: 16 }}>
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
        <Col xs={24} xl={12}>
          <Card title="Etapas com maior gargalo" style={{ borderRadius: 16 }}>
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
