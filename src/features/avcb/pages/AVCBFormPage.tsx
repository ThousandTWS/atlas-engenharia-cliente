/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
  App,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  HomeOutlined,
  DollarOutlined,
  FireOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { avcbService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { RichTextEditor } from '../../../shared/components/forms/RichTextEditor';

const { Title, Text } = Typography;

const SITUACAO_OPTIONS = [
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
  { label: 'Concluído', value: 'CONCLUIDO' },
  { label: 'Cancelado', value: 'CANCELADO' },
];

const formatCurrencyInput = (value?: string | number) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return '';
  }

  return `R$ ${numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const parseCurrencyInput = (value?: string) => {
  if (!value) {
    return 0;
  }

  const parsedValue = Number(
    value
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, ''),
  );

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

export const AVCBFormPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isMobile, isDarkMode } = useLayout();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing || !id) {
      form.resetFields();
      return;
    }

    const loadAVCB = async () => {
      setLoading(true);
      try {
        const data = await avcbService.getById(id) as any;
        form.setFieldsValue({
          ...data,
          dataContrato: data?.dataContrato ? dayjs(data.dataContrato) : dayjs(),
        });
      } catch (error: any) {
        message.error('Erro ao carregar AVCB: ' + error.message);
        navigate('/avcb');
      } finally {
        setLoading(false);
      }
    };

    loadAVCB();
  }, [form, id, isEditing, message, navigate]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const formattedValues = {
        ...values,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      };

      if (isEditing && id) {
        await avcbService.update(id, formattedValues);
        message.success('AVCB atualizado com sucesso');
      } else {
        await avcbService.create(formattedValues);
        message.success('AVCB cadastrado com sucesso');
      }

      navigate('/avcb');
    } catch (error: any) {
      message.error('Erro ao salvar AVCB: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel AVCB', href: '/avcb' },
          { title: isEditing ? 'Editar AVCB' : 'Novo AVCB' },
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
            {isEditing ? 'Editar AVCB' : 'Cadastrar Novo AVCB'}
          </Title>
          <Text type="secondary">Gerenciamento de Auto de Vistoria do Corpo de Bombeiros.</Text>
        </Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/avcb')} style={{ width: isMobile ? '100%' : 'auto' }}>
          Voltar
        </Button>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            situacao: 'EM_ANDAMENTO',
            dataContrato: dayjs(),
            recebido: 0,
            aReceber: 0,
            custos: 0,
          }}
          scrollToFirstError
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={14}>
              <Card
                title={<span><FireOutlined /> Informações do Processo</span>}
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? 'none' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação Atual"
                      rules={[{ required: true, message: 'Selecione a situação atual' }]}
                    >
                      <Select
                        style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        options={SITUACAO_OPTIONS}
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
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação / Observações"
                      rules={[{ required: true, message: 'Insira uma descrição' }]}
                    >
                      <RichTextEditor
                        placeholder="Detalhes sobre o andamento do AVCB..."
                        minHeight={130}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span><DollarOutlined /> Informações Financeiras</span>}
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? 'none' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="nf" label="Nota Fiscal (NF)">
                      <Input
                        style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        placeholder="NF-000X"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="valorContrato"
                      label="Valor do Contrato"
                      rules={[{ required: true, message: 'Insira o valor' }]}
                    >
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                      <Input
                        style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        placeholder="Ex: À vista, 30/60 dias"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Recebido">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="aReceber" label="A Receber">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="custos" label="Custos">
                      <InputNumber
                        style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                        min={0}
                        precision={2}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button style={{ background: isDarkMode ? '#171C2A' : '#fff' }} onClick={() => navigate('/avcb')}>
                  Cancelar
                </Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar AVCB'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
};
