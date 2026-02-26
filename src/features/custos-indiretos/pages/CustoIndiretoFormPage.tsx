/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Form,
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
  FileTextOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { custosIndiretosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { RichTextEditor } from '../../../shared/components/forms/RichTextEditor';

const { Title, Text } = Typography;

const CATEGORIA_OPTIONS = [
  { label: 'Administrativo', value: 'Administrativo' },
  { label: 'Infraestrutura', value: 'Infraestrutura' },
  { label: 'Pessoal', value: 'Pessoal' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Outros', value: 'Outros' },
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

export const CustoIndiretoFormPage: React.FC = () => {
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

    const loadCusto = async () => {
      setLoading(true);
      try {
        const data = await custosIndiretosService.getById(id) as any;
        form.setFieldsValue({
          ...data,
          data: data?.data ? dayjs(data.data) : dayjs(),
        });
      } catch (error: any) {
        message.error('Erro ao carregar custo indireto: ' + error.message);
        navigate('/custos-indiretos');
      } finally {
        setLoading(false);
      }
    };

    loadCusto();
  }, [form, id, isEditing, message, navigate]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const formattedValues = {
        ...values,
        data: values.data.format('YYYY-MM-DD'),
      };

      if (isEditing && id) {
        await custosIndiretosService.update(id, formattedValues);
        message.success('Custo indireto atualizado com sucesso');
      } else {
        await custosIndiretosService.create(formattedValues);
        message.success('Custo indireto cadastrado com sucesso');
      }

      navigate('/custos-indiretos');
    } catch (error: any) {
      message.error('Erro ao salvar custo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Custos Indiretos', href: '/custos-indiretos' },
          { title: isEditing ? 'Editar Custo' : 'Novo Custo' },
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
            {isEditing ? 'Editar Custo Indireto' : 'Cadastrar Novo Custo Indireto'}
          </Title>
          <Text type="secondary">Gerencie despesas administrativas e operacionais fixas.</Text>
        </Space>
        <Button className="atlas-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate('/custos-indiretos')} style={{ width: isMobile ? '100%' : 'auto' }}>
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
          }}
        >
          <Card
            title={<span><FileTextOutlined /> Informações da Despesa</span>}
            style={{
              marginBottom: 24,
              borderRadius: 8,
              background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
              border: isDarkMode ? 'none' : '1px solid #CBD5E1',
            }}
          >
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="descricao"
                  label="Descrição"
                  rules={[{ required: true, message: 'Por favor, insira a descrição' }]}
                >
                  <RichTextEditor
                    placeholder="Ex: Aluguel de escritório"
                    minHeight={120}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="categoria"
                  label="Categoria"
                  rules={[{ required: true, message: 'Selecione a categoria' }]}
                >
                  <Select
                    style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                    placeholder="Selecione"
                    options={CATEGORIA_OPTIONS}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="data"
                  label="Data"
                  rules={[{ required: true, message: 'Selecione a data' }]}
                >
                  <DatePicker style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="valor"
                  label="Valor"
                  rules={[{ required: true, message: 'Insira o valor' }]}
                >
                  <InputNumber
                    style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }}
                    size="large"
                    min={0}
                    precision={2}
                    formatter={formatCurrencyInput}
                    parser={parseCurrencyInput}
                    prefix={<DollarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button style={{ background: isDarkMode ? '#171C2A' : '#fff' }} onClick={() => navigate('/custos-indiretos')}>
              Cancelar
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Custo'}
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};
