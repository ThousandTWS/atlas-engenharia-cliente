/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Breadcrumb,
  Divider,
  Statistic,
  Tag,
  theme,
  App,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  UserOutlined,
  HomeOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { processosAdmService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { RichTextEditor } from '../../../shared/components/forms/RichTextEditor';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currencyInput';

const { Title, Text } = Typography;

const SITUACAO_OPTIONS = [
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
  { label: 'Concluído', value: 'CONCLUIDO' },
  { label: 'Cancelado', value: 'CANCELADO' },
];

const formatCurrencyValue = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);

export const ProcessoAdmFormPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const { isMobile, isDarkMode } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const valorContrato = Number(Form.useWatch('valorContrato', form) || 0);
  const recebido = Number(Form.useWatch('recebido', form) || 0);
  const custos = Number(Form.useWatch('custos', form) || 0);
  const aReceber = Number(Form.useWatch('aReceber', form) || 0);
  const saldoLiquido = valorContrato - recebido - custos;

  const sectionCardStyle = useMemo(
    () => ({
      borderRadius: 12,
      background: isDarkMode ? '#0E1629' : token.colorBgContainer,
      border: `1px solid ${isDarkMode ? '#253452' : token.colorBorderSecondary}`,
      boxShadow: isDarkMode ? '0 8px 24px rgba(0, 0, 0, 0.25)' : '0 10px 30px rgba(15, 23, 42, 0.05)',
    }),
    [isDarkMode, token.colorBgContainer, token.colorBorderSecondary],
  );

  const sectionCardStyles = useMemo(
    () => ({
      header: {
        borderBottom: `1px solid ${isDarkMode ? '#253452' : token.colorSplit}`,
        paddingInline: 20,
        minHeight: 54,
      },
      body: {
        padding: 20,
      },
    }),
    [isDarkMode, token.colorSplit],
  );

  const fieldStyle = useMemo(
    () => ({
      background: isDarkMode ? '#151F33' : token.colorBgContainer,
      border: `1px solid ${isDarkMode ? '#2D3F61' : token.colorBorder}`,
    }),
    [isDarkMode, token.colorBgContainer, token.colorBorder],
  );

  useEffect(() => {
    if (!isEditing) {
      form.resetFields();
      return;
    }

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      message.error('Processo inválido para edição.');
      navigate('/processos');
      return;
    }

    const loadProcesso = async () => {
      setLoading(true);
      try {
        const record = await processosAdmService.getById(numericId) as any;
        form.setFieldsValue({
          ...record,
          dataContrato: record?.dataContrato ? dayjs(record.dataContrato) : dayjs(),
          proximaParcela: record?.proximaParcela ? dayjs(record.proximaParcela) : null,
        });
      } catch (error: any) {
        message.error('Erro ao carregar processo: ' + error.message);
        navigate('/processos');
      } finally {
        setLoading(false);
      }
    };

    loadProcesso();
  }, [form, id, isEditing, message, navigate]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        dataContrato: values.dataContrato ? values.dataContrato.format('YYYY-MM-DD') : '',
        proximaParcela: values.proximaParcela ? values.proximaParcela.format('YYYY-MM-DD') : '',
      };

      if (isEditing && id) {
        await processosAdmService.update(id, payload);
        message.success('Processo administrativo atualizado com sucesso');
      } else {
        await processosAdmService.create(payload);
        message.success('Processo administrativo cadastrado com sucesso');
      }

      navigate('/processos');
    } catch (error: any) {
      message.error('Erro ao salvar processo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestão' },
          { title: 'Processos Administrativos', href: '/processos' },
          { title: isEditing ? 'Editar Processo' : 'Novo Processo' },
        ]}
        style={{ marginBottom: 16 }}
      />

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
            {isEditing ? 'Editar Processo Administrativo' : 'Cadastrar Novo Processo'}
          </Title>
          <Text type="secondary">Cadastro de dados contratuais, documentação e controle financeiro.</Text>
        </Space>
        <Button className="prevent-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate('/processos')} style={{ width: isMobile ? '100%' : 'auto' }}>
          Voltar
        </Button>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          scrollToFirstError
          initialValues={{
            situacao: 'EM_ANDAMENTO',
            dataContrato: dayjs(),
            recebido: 0,
            aReceber: 0,
            custos: 0,
          }}
        >
          <Row gutter={[20, 20]} align="stretch">
            <Col xs={24} lg={14} style={{ display: 'flex' }}>
              <Card
                title={
                  <Space orientation="vertical" size={0}>
                    <Space size={8}>
                      <UserOutlined style={{ color: token.colorPrimary }} />
                      <Text strong>Identificação e Status</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Dados principais do cliente e situação do processo.
                    </Text>
                  </Space>
                }
                style={{ ...sectionCardStyle, width: '100%' }}
                styles={sectionCardStyles}
              >
                <Row gutter={[16, 0]}>
                  <Col span={24}>
                    <Form.Item
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Insira o nome do cliente' }]}
                    >
                      <Input
                        size="large"
                        style={fieldStyle}
                        placeholder="Ex: João da Silva"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação"
                      rules={[{ required: true, message: 'Selecione a situação' }]}
                    >
                      <Select
                        size="large"
                        style={fieldStyle}
                        options={SITUACAO_OPTIONS}
                        placeholder="Selecione uma situação"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dataContrato"
                      label="Data do Contrato"
                      rules={[{ required: true, message: 'Selecione a data' }]}
                    >
                      <DatePicker
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação"
                    >
                      <RichTextEditor
                        placeholder="Ex: Aguardando assinatura de aditivo."
                        minHeight={120}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10} style={{ display: 'flex' }}>
              <Card
                title={
                  <Space orientation="vertical" size={0}>
                    <Space size={8}>
                      <DollarOutlined style={{ color: token.colorPrimary }} />
                      <Text strong>Financeiro Administrativo</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Valores contratuais, recebimentos e custos.
                    </Text>
                  </Space>
                }
                style={{ ...sectionCardStyle, width: '100%' }}
                styles={sectionCardStyles}
              >
                <Row gutter={[16, 0]}>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total do Contrato"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="recebido" label="Valor Recebido">
                      <InputNumber
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="aReceber" label="Valor a Receber">
                      <InputNumber
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos Administrativos">
                      <InputNumber
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]} align="stretch">
            <Col xs={24} lg={14} style={{ display: 'flex' }}>
              <Card
                title={
                  <Space orientation="vertical" size={0}>
                    <Space size={8}>
                      <InfoCircleOutlined style={{ color: token.colorPrimary }} />
                      <Text strong>Documentação e Prazos</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Informações fiscais e agenda de parcelas.
                    </Text>
                  </Space>
                }
                style={{ ...sectionCardStyle, width: '100%' }}
                styles={sectionCardStyles}
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="descontoNf" label="Desconto NF (opcional)">
                      <InputNumber
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="proximaParcela" label="Próxima Parcela">
                      <DatePicker
                        size="large"
                        style={{ width: '100%', ...fieldStyle }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input
                        size="large"
                        style={fieldStyle}
                        placeholder="Ex: 30/60 dias ou à vista"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10} style={{ display: 'flex' }}>
              <Card
                title={<Text strong>Resumo Financeiro</Text>}
                style={{ ...sectionCardStyle, width: '100%' }}
                styles={sectionCardStyles}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Space size={[12, 10]} wrap>
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Contrato</Text>
                        <Tag variant="filled" className="prevent-status-badge prevent-status-badge-info" style={{ marginInlineEnd: 0 }}>
                          <span className="prevent-status-badge-dot" />
                          {formatCurrencyValue(valorContrato)}
                        </Tag>
                      </div>
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Custos</Text>
                        <Tag variant="filled" className="prevent-status-badge prevent-status-badge-danger" style={{ marginInlineEnd: 0 }}>
                          <span className="prevent-status-badge-dot" />
                          {formatCurrencyValue(custos)}
                        </Tag>
                      </div>
                      <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Saldo Líquido</Text>
                        <Tag
                          variant="filled"
                          className={`prevent-status-badge ${saldoLiquido < 0 ? 'prevent-status-badge-danger' : 'prevent-status-badge-success'}`}
                          style={{ marginInlineEnd: 0 }}
                        >
                          <span className="prevent-status-badge-dot" />
                          {formatCurrencyValue(saldoLiquido)}
                        </Tag>
                      </div>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Recebido"
                      value={formatCurrencyValue(recebido)}
                      valueStyle={{ fontSize: 16, color: token.colorText }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="A Receber"
                      value={formatCurrencyValue(aReceber)}
                      valueStyle={{ fontSize: 16, color: token.colorText }}
                    />
                  </Col>
                  <Col span={24}>
                    <Statistic
                      title="Saldo Líquido (Contrato - Recebido - Custos)"
                      value={formatCurrencyValue(saldoLiquido)}
                      valueStyle={{
                        fontSize: 16,
                        color: token.colorText,
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Divider style={{ borderColor: isDarkMode ? '#253452' : token.colorSplit, margin: '20px 0 16px' }} />

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              flexDirection: isMobile ? 'column-reverse' : 'row',
            }}
          >
            <Button
              size="large"
              block={isMobile}
              onClick={() => navigate('/processos')}
              style={{ background: isDarkMode ? '#151F33' : token.colorBgContainer }}
            >
              Cancelar
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large" loading={saving} block={isMobile}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Processo'}
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};
