/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
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
  FileTextOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { lancamentosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { RichTextEditor } from '../../../shared/components/forms/RichTextEditor';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currencyInput';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const LancamentoFormPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isMobile, isDarkMode } = useLayout();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const faturamento = Number(Form.useWatch('faturamento', form) || 0);
  const custoDireto = Number(Form.useWatch('custoDireto', form) || 0);

  useEffect(() => {
    form.setFieldsValue({ lucro: faturamento - custoDireto });
  }, [custoDireto, faturamento, form]);

  useEffect(() => {
    if (!isEditing || !id) {
      form.resetFields();
      return;
    }

    const loadLancamento = async () => {
      setLoading(true);
      try {
        const data = await lancamentosService.getById(id) as any;
        form.setFieldsValue({
          ...data,
          data: data?.data ? dayjs(data.data) : dayjs(),
        });
      } catch (error: any) {
        message.error('Erro ao carregar lançamento: ' + error.message);
        navigate('/lancamentos');
      } finally {
        setLoading(false);
      }
    };

    loadLancamento();
  }, [form, id, isEditing, message, navigate]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const formattedValues = {
        ...values,
        data: values.data.format('YYYY-MM-DD'),
      };

      if (isEditing && id) {
        await lancamentosService.update(id, formattedValues);
        message.success('Lançamento atualizado com sucesso');
      } else {
        await lancamentosService.create(formattedValues);
        message.success('Lançamento cadastrado com sucesso');
      }

      navigate('/lancamentos');
    } catch (error: any) {
      message.error('Erro ao salvar lançamento: ' + error.message);
    } finally {
      setSaving(false);
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
          gap: '16px',
        }}
      >
        <Space orientation="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            {isEditing ? 'Editar Lançamento' : 'Cadastrar Novo Lançamento'}
          </Title>
          <Text type="secondary">Acompanhe faturamentos, custos e lucratividade dos seus projetos.</Text>
        </Space>
        <Button className="atlas-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate('/lancamentos')} style={{ width: isMobile ? '100%' : 'auto' }}>
          Voltar
        </Button>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            data: dayjs(),
            faturamento: 0,
            custoDireto: 0,
            lucro: 0,
          }}
        >
          <Row gutter={16}>
            <Col xs={24}>
              <Card
                title={<span><FileTextOutlined /> Informações Gerais</span>}
                size="small"
                style={{
                  marginBottom: 16,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? 'none' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="descricao"
                      label="Descrição do Lançamento"
                      rules={[{ required: true, message: 'Insira a descrição' }]}
                    >
                      <RichTextEditor
                        placeholder="Ex: Compra de materiais hidráulicos"
                        minHeight={120}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="data"
                      label="Data"
                      rules={[{ required: true, message: 'Selecione a data' }]}
                    >
                      <DatePicker style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24}>
              <Card
                title={<span><DollarOutlined /> Valores e Lucratividade</span>}
                size="small"
                style={{
                  marginBottom: 16,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? 'none' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="faturamento"
                      label="Faturamento"
                      rules={[{ required: true, message: 'Informe o faturamento' }]}
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
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="custoDireto"
                      label="Custo Direto"
                      rules={[{ required: true, message: 'Informe o custo' }]}
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
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="lucro"
                      label="Lucro Estimado"
                    >
                      <InputNumber
                        disabled
                        style={{ width: '100%', fontWeight: 'bold' }}
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24}>
              <Form.Item name="observacao" label="Observações">
                <TextArea style={{ background: isDarkMode ? '#0A0F1C' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} rows={3} placeholder="Notas adicionais sobre o lançamento..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button style={{ background: isDarkMode ? '#171C2A' : '#fff' }} onClick={() => navigate('/lancamentos')}>
              Cancelar
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Lançamento'}
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};
