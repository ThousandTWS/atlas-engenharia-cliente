/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  App,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cliente } from '../../../core/services/client/clientesService';
import { clientesService } from '../../../core/services/client/clientesService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { cepService } from '../../../core/services/cepService';
import { normalizeCepBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

const ESTADO_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ label: uf, value: uf }));

export const ClienteFormPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isMobile, isDarkMode } = useLayout();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const lastCepRef = React.useRef<string>('');

  const watchedCep = Form.useWatch<string>('cep', form) || '';

  useEffect(() => {
    if (!isEditing || !id) {
      form.resetFields();
      return;
    }

    const loadCliente = async () => {
      setLoading(true);
      try {
        const data = await clientesService.getById(id);
        form.setFieldsValue(data);
      } catch (error: any) {
        message.error('Erro ao carregar cliente: ' + error.message);
        navigate('/gestao-de-clientes');
      } finally {
        setLoading(false);
      }
    };

    loadCliente();
  }, [form, id, isEditing, message, navigate]);

  const fillAddressByCep = async (rawCep: string) => {
    const digits = String(rawCep || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length !== 8) {
      return;
    }

    if (lastCepRef.current === digits) {
      return;
    }

    setCepLoading(true);
    try {
      const lookup = await cepService.lookup(digits);
      if (!lookup) {
        return;
      }

      lastCepRef.current = digits;

      const current = form.getFieldsValue(['rua', 'bairro', 'cidade', 'estado']);
      form.setFieldsValue({
        cep: lookup.cep || digits,
        rua: current.rua || lookup.street,
        bairro: current.bairro || lookup.neighborhood,
        cidade: current.cidade || lookup.city,
        estado: current.estado || String(lookup.state || '').toUpperCase(),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao consultar CEP.';
      message.error(errorMessage);
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => {
    const digits = String(watchedCep || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length !== 8) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fillAddressByCep(digits);
    }, 450);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCep]);

  const onFinish = async (values: Cliente) => {
    setSaving(true);
    try {
      if (isEditing && id) {
        await clientesService.update(id, values);
        message.success('Cliente atualizado com sucesso');
      } else {
        await clientesService.create(values);
        message.success('Cliente cadastrado com sucesso');
      }

      navigate('/gestao-de-clientes');
    } catch (error: any) {
      message.error('Erro ao salvar cliente: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
            {isEditing ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          </Title>
          <Text type="secondary">Dados cadastrais, contato e endereço do cliente.</Text>
        </Space>
        <Button className="atlas-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate('/gestao-de-clientes')} style={{ width: isMobile ? '100%' : 'auto' }}>
          Voltar
        </Button>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={12}>
              <Card
                title={<span><UserOutlined /> Dados Cadastrais</span>}
                style={{
                  borderRadius: 8,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="cnpjCpf"
                      label="CNPJ/CPF"
                      rules={[{ required: true, message: 'Informe o CNPJ/CPF' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="12.345.678/0001-99" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="razaoSocial"
                      label="Razão Social"
                      rules={[{ required: true, message: 'Informe a razão social' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="Ex: Exemplo Industria LTDA" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="nomeContato"
                      label="Nome do Contato"
                      rules={[{ required: true, message: 'Informe o nome do contato' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="João Silva" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="telefone"
                      label="Telefone"
                      rules={[{ required: true, message: 'Informe o telefone' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="(11) 98765-4321" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'Informe o email' },
                        { type: 'email', message: 'Email inválido' },
                      ]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="contato@empresa.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={<span><EnvironmentOutlined /> Endereço</span>}
                style={{
                  borderRadius: 8,
                  background: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                  border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1',
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="cep"
                      label="CEP"
                      rules={[{ required: true, message: 'Informe o CEP' }]}
                      normalize={normalizeCepBR}
                    >
                      <Input
                        style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }}
                        placeholder="01234-567"
                        suffix={cepLoading ? <LoadingOutlined /> : null}
                        onBlur={() => void fillAddressByCep(String(form.getFieldValue('cep') || ''))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="rua"
                      label="Rua"
                      rules={[{ required: true, message: 'Informe a rua' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="Rua das Empresas" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="numero"
                      label="Número"
                      rules={[{ required: true, message: 'Informe o número' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="123" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="complemento"
                      label="Complemento"
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="Sala 12" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="bairro"
                      label="Bairro"
                      rules={[{ required: true, message: 'Informe o bairro' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="Centro" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="cidade"
                      label="Cidade"
                      rules={[{ required: true, message: 'Informe a cidade' }]}
                    >
                      <Input style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }} placeholder="São Paulo" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="estado"
                      label="Estado (UF)"
                      rules={[{ required: true, message: 'Selecione o estado' }]}
                    >
                      <Select
                        style={{ background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'solid 1px #1E2A47' : 'solid 1px #CBD5E1' }}
                        options={ESTADO_OPTIONS}
                        placeholder="UF"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 20, flexDirection: isMobile ? 'column-reverse' : 'row' }}>
            <Button
              size="large"
              block={isMobile}
              onClick={() => navigate('/gestao-de-clientes')}
              style={{ background: isDarkMode ? '#151F33' : '#fff' }}
            >
              Cancelar
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large" loading={saving} block={isMobile}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};
