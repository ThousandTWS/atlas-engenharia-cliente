import React, { useState } from 'react';
import { Form, Input, Button, Typography, App, Row, Col } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, UserAddOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService, type RegisterDTO } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

export const RegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterDTO) => {
    setLoading(true);
    try {
      await authService.register(values);
      message.success('Cadastro criado! Enviamos um código para seu e-mail.');
      navigate('/auth/verify-email', { replace: true, state: { email: values.email } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar cadastro.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Cadastro"
      title="Criar conta"
      subtitle="Crie sua conta e valide seu e-mail para acessar."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Já possui conta?</Text>
          <Link to="/auth/login" className="atlas-auth-link">Fazer login</Link>
        </div>
      )}
    >
      <Form name="register_form" onFinish={onFinish} layout="vertical" size="large">
        <Row gutter={14}>
          <Col span={24}>
            <Form.Item
              name="nomeCompleto"
              label="Nome completo"
              rules={[{ required: true, message: 'Informe seu nome completo.' }]}
            >
              <Input className="atlas-form-input" prefix={<IdcardOutlined />} placeholder="Seu nome completo" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: 'Informe seu e-mail.' },
                { type: 'email', message: 'E-mail inválido.' },
              ]}
            >
              <Input className="atlas-form-input" prefix={<MailOutlined />} placeholder="seuemail@empresa.com" autoCapitalize="none" autoCorrect="off" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="confirmarEmail"
              label="Confirmar e-mail"
              dependencies={['email']}
              rules={[
                { required: true, message: 'Confirme seu e-mail.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('email') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Os e-mails não coincidem.'));
                  },
                }),
              ]}
            >
              <Input className="atlas-form-input" prefix={<MailOutlined />} placeholder="Confirme seu e-mail" autoCapitalize="none" autoCorrect="off" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="username"
              label="Usuário"
              rules={[{ required: true, message: 'Informe seu usuário.' }]}
            >
              <Input className="atlas-form-input" prefix={<UserOutlined />} placeholder="seu.usuario" autoCapitalize="none" autoCorrect="off" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="telefone"
              label="Telefone"
              rules={[{ required: true, message: 'Informe seu telefone.' }]}
            >
              <Input className="atlas-form-input" prefix={<PhoneOutlined />} placeholder="(11) 99999-9999" autoCapitalize="none" autoCorrect="off" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="password"
              label="Senha"
              rules={[
                { required: true, message: 'Informe sua senha.' },
                { min: 6, message: 'A senha deve ter pelo menos 6 caracteres.' },
              ]}
            >
              <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Senha" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="confirmarPassword"
              label="Confirmar senha"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Confirme sua senha.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('As senhas não coincidem.'));
                  },
                }),
              ]}
            >
              <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Confirme a senha" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<UserAddOutlined />}
            size="large"
            loading={loading}
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Criar conta
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};

