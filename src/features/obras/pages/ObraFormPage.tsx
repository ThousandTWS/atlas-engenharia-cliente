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
  UserOutlined,
  HomeOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { obrasService } from '../../../core/services/obrasService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { RichTextEditor } from '../../../shared/components/forms/RichTextEditor';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currencyInput';

const { Title, Text } = Typography;

const SITUACAO_OPTIONS = [
  { label: 'Orçamento', value: 'ORCAMENTO' },
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
  { label: 'Concluído', value: 'CONCLUIDO' },
  { label: 'Suspenso', value: 'SUSPENSO' },
  { label: 'Cancelado', value: 'CANCELADO' },
];

export const ObraFormPage: React.FC = () => {
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

    const loadObra = async () => {
      setLoading(true);
      try {
        const data = await obrasService.getById(id);
        form.setFieldsValue({
          ...data,
          dataContrato: data?.dataContrato ? dayjs(data.dataContrato) : dayjs(),
        });
      } catch (error: any) {
        message.error('Erro ao carregar obra: ' + error.message);
        navigate('/obras');
      } finally {
        setLoading(false);
      }
    };

    loadObra();
  }, [form, id, isEditing, message, navigate]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const obraData = {
        ...values,
        dataContrato: values.dataContrato.format('YYYY-MM-DD'),
      };

      if (isEditing && id) {
        await obrasService.update(id, obraData);
        message.success('Obra atualizada com sucesso');
      } else {
        await obrasService.create(obraData);
        message.success('Obra cadastrada com sucesso');
      }

      navigate('/obras');
    } catch (error: any) {
      message.error('Erro ao salvar obra: ' + error.message);
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
          { title: 'Painel de Obras', href: '/obras' },
          { title: isEditing ? 'Editar Obra' : 'Nova Obra' },
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
            {isEditing ? 'Editar Obra' : 'Cadastrar Nova Obra'}
          </Title>
          <Text type="secondary">Gerencie informações de cliente, serviço e financeiro.</Text>
        </Space>
        <Button className="atlas-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate('/obras')} style={{ width: isMobile ? '100%' : 'auto' }}>
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
                title={<span><UserOutlined /> Informações do Cliente e Serviço</span>}
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
                      name="nomeCliente"
                      label="Nome do Cliente"
                      rules={[{ required: true, message: 'Por favor, insira o nome do cliente' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} placeholder="Ex: Construtora Rocha" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="telefone"
                      label="Telefone de Contato"
                      rules={[{ required: true, message: 'Por favor, insira o telefone' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} placeholder="(00) 00000-0000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="endereco"
                      label="Endereço da Obra"
                      rules={[{ required: true, message: 'Por favor, insira o endereço' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} placeholder="Rua, número, bairro, cidade - UF" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="servico"
                      label="Tipo de Serviço"
                      rules={[{ required: true, message: 'Por favor, descreva o serviço' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} placeholder="Ex: Reforma estrutural, Pintura, Elétrica" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="situacao"
                      label="Situação Atual"
                      rules={[{ required: true, message: 'Selecione a situação' }]}
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
                      <DatePicker style={{ width: '100%', background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="descricaoSituacao"
                      label="Descrição da Situação / Observações"
                    >
                      <RichTextEditor
                        placeholder="Detalhes sobre o progresso..."
                        minHeight={120}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span><DollarOutlined /> Financeiro</span>}
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? 'none' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="descontoNf" label="Desconto NF (opcional)">
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
                    <Form.Item
                      name="valorContrato"
                      label="Valor Total do Contrato"
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
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} placeholder="Ex: Entrada + 3x" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="recebido" label="Valor Recebido">
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
                    <Form.Item name="custos" label="Custos Estimados">
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
                <Button style={{ background: isDarkMode ? '#171C2A' : '#fff' }} onClick={() => navigate('/obras')}>
                  Cancelar
                </Button>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar Obra'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
};
