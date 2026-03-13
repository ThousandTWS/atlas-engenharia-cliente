import React, { useEffect, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  Upload,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  HomeOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { getFilterControlStyle, getFilterSecondaryButtonStyle } from '../../../shared/utils/filterFieldStyles';
import { cadastrosApi, type ProviderRecord, type ServiceRegistrationRecord } from '../../cadastros/cadastrosApi';
import {
  financialLaunchService,
  type FinancialLaunchPayload,
  type FinancialLaunchStatus,
  type FinancialLaunchType,
} from '../services/financialLaunchService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const typeOptions: { label: string; value: FinancialLaunchType }[] = [
  { label: 'Entrada', value: 'ENTRADA' },
  { label: 'Saída', value: 'SAIDA' },
];

const statusOptions: { label: string; value: FinancialLaunchStatus }[] = [
  { label: 'Previsto', value: 'PREVISTO' },
  { label: 'A pagar', value: 'A_PAGAR' },
  { label: 'Pago', value: 'PAGO' },
  { label: 'A confirmar', value: 'A_CONFIRMAR' },
];

const defaultStatusByType: Record<FinancialLaunchType, FinancialLaunchStatus> = {
  ENTRADA: 'A_CONFIRMAR',
  SAIDA: 'A_PAGAR',
};

const paymentMethodOptions = [
  'PIX',
  'Boleto',
  'Transferência',
  'Cartão',
  'Dinheiro',
  'Asaas',
  'Inter',
].map((value) => ({ label: value, value }));

export const LancamentoFormPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { isMobile, isDarkMode } = useLayout();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceRegistrationRecord[]>([]);
  const [providerOptions, setProviderOptions] = useState<ProviderRecord[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false);

  const launchType = Form.useWatch<FinancialLaunchType>('tipo', form) || 'ENTRADA';
  const receiptFileList: UploadFile[] = selectedFile
    ? [{ uid: 'receipt', name: selectedFile.name, status: 'done' }]
    : [];

  useEffect(() => {
    const initialType = (searchParams.get('tipo') as FinancialLaunchType | null) || 'ENTRADA';
    form.setFieldsValue({
      tipo: initialType,
      status: defaultStatusByType[initialType],
      data: dayjs(),
    });
  }, [form, searchParams]);

  useEffect(() => {
    const loadInitialOptions = async () => {
      setServiceLoading(true);
      setProviderLoading(true);
      try {
        const [servicesResponse, providersResponse] = await Promise.all([
          cadastrosApi.getServices({ size: 20, page: 0 }),
          cadastrosApi.getProviders({ size: 20, page: 0 }),
        ]);
        setServiceOptions(servicesResponse.content);
        setProviderOptions(providersResponse.content);
      } catch (error) {
        message.error(`Erro ao carregar vínculos de cadastro: ${(error as Error).message}`);
      } finally {
        setServiceLoading(false);
        setProviderLoading(false);
      }
    };

    void loadInitialOptions();
  }, [message]);

  useEffect(() => {
    if (!isEditing || !id) {
      return;
    }

    const loadLancamento = async () => {
      setLoading(true);
      try {
        const data = await financialLaunchService.getById(id);
        form.setFieldsValue({
          ...data,
          data: data.data ? dayjs(data.data) : dayjs(),
          tipo: data.tipo,
          status: data.status,
          codigoServico: data.codigoServico || undefined,
          nomeCliente: data.nomeCliente || undefined,
          prestadorId: data.prestadorId || undefined,
        });
      } catch (error) {
        message.error(`Erro ao carregar lançamento: ${(error as Error).message}`);
        navigate('/lancamentos');
      } finally {
        setLoading(false);
      }
    };

    void loadLancamento();
  }, [form, id, isEditing, message, navigate]);

  const fetchServices = async (codigo?: string) => {
    setServiceLoading(true);
    try {
      const response = await cadastrosApi.getServices({ codigo, size: 20, page: 0 });
      setServiceOptions(response.content);
      return response.content;
    } finally {
      setServiceLoading(false);
    }
  };

  const fetchProviders = async (termo?: string) => {
    setProviderLoading(true);
    try {
      const response = await cadastrosApi.getProviders({ termo, size: 20, page: 0 });
      setProviderOptions(response.content);
      return response.content;
    } finally {
      setProviderLoading(false);
    }
  };

  const syncServiceFields = async (codigoServico?: string) => {
    if (!codigoServico) {
      form.setFieldValue('nomeCliente', undefined);
      return;
    }

    const existing = serviceOptions.find((service) => service.code === codigoServico);
    const service = existing || (await fetchServices(codigoServico)).find((item) => item.code === codigoServico);

    if (service) {
      form.setFieldsValue({
        codigoServico: service.code,
        nomeCliente: service.companyName,
      });
      return;
    }

    form.setFieldValue('nomeCliente', undefined);
    message.warning(`Serviço ${codigoServico} não encontrado.`);
  };

  const buildPayload = (values: Record<string, unknown>): FinancialLaunchPayload => ({
    tipo: values.tipo as FinancialLaunchType,
    status: values.status as FinancialLaunchStatus,
    descricao: String(values.descricao || '').trim(),
    data: (values.data as dayjs.Dayjs).format('YYYY-MM-DD'),
    valor: Number(values.valor || 0),
    formaPagamento: values.formaPagamento ? String(values.formaPagamento) : null,
    metodoPagamento: values.metodoPagamento ? String(values.metodoPagamento) : null,
    codigoServico: values.codigoServico ? String(values.codigoServico) : null,
    nomeCliente: values.nomeCliente ? String(values.nomeCliente) : null,
    prestadorId: values.prestadorId ? Number(values.prestadorId) : null,
    nomePrestador: (() => {
      const selected = providerOptions.find((provider) => provider.id === values.prestadorId);
      return selected?.name || null;
    })(),
    observacao: values.observacao ? String(values.observacao) : null,
  });

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = buildPayload(values);
      const saved = isEditing && id
        ? await financialLaunchService.update(id, payload)
        : await financialLaunchService.create(payload);

      if (selectedFile) {
        setUploadingReceipt(true);
        await financialLaunchService.uploadReceipt(saved.id, selectedFile);
      }

      message.success(isEditing ? 'Lançamento atualizado com sucesso.' : 'Lançamento criado com sucesso.');
      navigate('/lancamentos');
    } catch (error) {
      message.error(`Erro ao salvar lançamento: ${(error as Error).message}`);
    } finally {
      setSaving(false);
      setUploadingReceipt(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Financeiro' },
          { title: 'Lançamentos', href: '/lancamentos' },
          { title: isEditing ? 'Editar Lançamento' : 'Novo Lançamento' },
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
          gap: 16,
        }}
      >
        <Space direction="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            {isEditing ? 'Editar Lançamento Financeiro' : 'Novo Lançamento Financeiro'}
          </Title>
          <Text type="secondary">
            {launchType === 'ENTRADA'
              ? 'Recebimentos vinculados a serviços com preenchimento automático do cliente.'
              : 'Pagamentos vinculados a serviços e prestadores, com status e comprovante.'}
          </Text>
        </Space>

        <Button
          className="atlas-back-button"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/lancamentos')}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Voltar
        </Button>
      </div>

      <Spin spinning={loading || uploadingReceipt}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void onFinish(values)}
          initialValues={{
            tipo: 'ENTRADA',
            status: 'A_CONFIRMAR',
            data: dayjs(),
            valor: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24}>
              <Card
                title={<span><FileTextOutlined /> Dados do lançamento</span>}
                size="small"
                style={{
                  marginBottom: 16,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? 'none' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="tipo"
                      label="Tipo"
                      rules={[{ required: true, message: 'Selecione o tipo' }]}
                    >
                      <Select
                        style={getFilterControlStyle(isDarkMode)}
                        options={typeOptions}
                        onChange={(value: FinancialLaunchType) => {
                          form.setFieldValue('status', defaultStatusByType[value]);
                          if (value === 'ENTRADA') {
                            form.setFieldValue('prestadorId', undefined);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="status"
                      label="Status"
                      rules={[{ required: true, message: 'Selecione o status' }]}
                    >
                      <Select style={getFilterControlStyle(isDarkMode)} options={statusOptions} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="data"
                      label="Data"
                      rules={[{ required: true, message: 'Selecione a data' }]}
                    >
                      <DatePicker format="DD/MM/YYYY" style={getFilterControlStyle(isDarkMode, '100%')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="valor"
                      label="Valor"
                      rules={[{ required: true, message: 'Informe o valor' }]}
                    >
                      <InputNumber
                        min={0.01}
                        precision={2}
                        style={getFilterControlStyle(isDarkMode, '100%')}
                        controls={false}
                        addonBefore="R$"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="codigoServico"
                      label="Código do serviço"
                      rules={launchType === 'ENTRADA'
                        ? [{ required: true, message: 'Informe o código do serviço' }]
                        : []}
                    >
                      <Select
                        style={getFilterControlStyle(isDarkMode)}
                        allowClear
                        showSearch
                        loading={serviceLoading}
                        filterOption={false}
                        placeholder="Busque ou selecione o código"
                        options={serviceOptions.map((service) => ({
                          label: `${service.code} - ${service.companyName}`,
                          value: service.code,
                        }))}
                        onSearch={(value) => { void fetchServices(value); }}
                        onChange={(value) => { void syncServiceFields(value); }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="nomeCliente" label="Cliente">
                      <Input
                        disabled
                        style={getFilterControlStyle(isDarkMode)}
                        placeholder="Preenchido automaticamente pelo serviço"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="prestadorId"
                      label="Prestador / fornecedor"
                      rules={launchType === 'SAIDA' && !form.getFieldValue('codigoServico')
                        ? [{ required: true, message: 'Selecione um prestador ou informe um serviço' }]
                        : []}
                    >
                      <Select
                        style={getFilterControlStyle(isDarkMode)}
                        allowClear
                        showSearch
                        loading={providerLoading}
                        filterOption={false}
                        disabled={launchType !== 'SAIDA'}
                        placeholder="Selecione o prestador"
                        options={providerOptions.map((provider) => ({
                          label: provider.name,
                          value: provider.id,
                        }))}
                        onSearch={(value) => { void fetchProviders(value); }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item name="formaPagamento" label="Forma de pagamento">
                      <Select
                        style={getFilterControlStyle(isDarkMode)}
                        allowClear
                        options={paymentMethodOptions}
                        placeholder="Forma"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="metodoPagamento" label="Método">
                      <Input
                        style={getFilterControlStyle(isDarkMode)}
                        placeholder="Ex: PIX chave, TED, boleto"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="descricao"
                      label="Descrição"
                      rules={[{ required: true, message: 'Informe a descrição' }]}
                    >
                      <Input
                        style={getFilterControlStyle(isDarkMode)}
                        placeholder="Descreva o lançamento"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="observacao" label="Observações">
                      <TextArea
                        rows={4}
                        style={getFilterControlStyle(isDarkMode)}
                        placeholder="Detalhes adicionais sobre o lançamento"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Comprovante">
                      <Upload
                        beforeUpload={(file) => {
                          setSelectedFile(file);
                          return false;
                        }}
                        onRemove={() => {
                          setSelectedFile(null);
                        }}
                        fileList={receiptFileList}
                        maxCount={1}
                      >
                        <Button
                          icon={<UploadOutlined />}
                          style={getFilterSecondaryButtonStyle(isDarkMode)}
                        >
                          Selecionar arquivo
                        </Button>
                      </Upload>
                      <Text type="secondary">
                        O arquivo é enviado após gravar o lançamento.
                      </Text>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              style={getFilterSecondaryButtonStyle(isDarkMode)}
              onClick={() => navigate('/lancamentos')}
            >
              Cancelar
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
              {isEditing ? 'Salvar alterações' : 'Cadastrar lançamento'}
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};
