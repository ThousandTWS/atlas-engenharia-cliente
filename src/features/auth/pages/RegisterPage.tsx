import React, { useState } from 'react';
import { Form, Input, Button, Typography, App, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import type { RegisterDTO } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';
import { GoogleRecaptcha, type GoogleRecaptchaHandle } from '../components/GoogleRecaptcha';
import { normalizePhoneBR } from '../../../shared/utils/inputFormat';

const { Text } = Typography;

export const RegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = React.useRef<GoogleRecaptchaHandle>(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? '6LcZCHgsAAAAADyLoe3Gc8X2DEJBWk1l_HMKEohX';
  const isRecaptchaConfigured = Boolean(recaptchaSiteKey);
  const handleCaptchaChange = React.useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  const onFinish = async (values: RegisterDTO) => {
    if (!isRecaptchaConfigured) {
      message.error('reCAPTCHA nao configurado. Defina VITE_RECAPTCHA_SITE_KEY.');
      return;
    }

    if (!captchaToken) {
      message.warning('Confirme o reCAPTCHA para continuar.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        ...values,
        recaptchaToken: captchaToken,
      });
      message.success('Conta criada com sucesso! Verifique seu e-mail.');
      navigate('/auth/verify-email', { state: { email: values.email } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar cadastro.';
      message.error(`Erro ao realizar cadastro: ${errorMessage}`);
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Cadastro"
      title="Criar Conta"
      subtitle="Preencha os dados abaixo para ativar seu acesso corporativo."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Ja possui conta?</Text>
          <Link to="/auth/login" className="atlas-auth-link">Fazer login</Link>
        </div>
      )}
    >
      <Form name="register_form" onFinish={onFinish} layout="vertical" size="large">
        <Row gutter={14}>
          <Col span={24}>
            <Form.Item
              name="nomeCompleto"
              label="Nome Completo"
              rules={[{ required: true, message: 'Por favor, insira seu nome completo.' }]}
            >
              <Input className="atlas-form-input" prefix={<UserOutlined />} placeholder="Ex: Joao da Silva" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="username"
              label="Usuario"
              rules={[{ required: true, message: 'Por favor, insira um nome de usuario.' }]}
            >
              <Input className="atlas-form-input" prefix={<UserOutlined />} placeholder="usuario123" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="telefone"
              label="Telefone"
              normalize={normalizePhoneBR}
              rules={[{ required: true, message: 'Por favor, insira seu telefone.' }]}
            >
              <Input className="atlas-form-input" prefix={<PhoneOutlined />} placeholder="(00) 00000-0000" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: 'Por favor, insira seu e-mail.' },
                { type: 'email', message: 'Por favor, insira um e-mail valido.' },
              ]}
            >
              <Input className="atlas-form-input" prefix={<MailOutlined />} placeholder="seu@email.com" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="confirmarEmail"
              label="Confirmar E-mail"
              dependencies={['email']}
              rules={[
                { required: true, message: 'Por favor, confirme seu e-mail.' },
                { type: 'email', message: 'Por favor, insira um e-mail valido.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('email') === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error('Os e-mails nao coincidem.'));
                  },
                }),
              ]}
            >
              <Input className="atlas-form-input" prefix={<MailOutlined />} placeholder="Confirme seu e-mail" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="password"
              label="Senha"
              rules={[
                { required: true, message: 'Por favor, insira sua senha.' },
                { min: 6, message: 'A senha deve ter pelo menos 6 caracteres.' },
              ]}
            >
              <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Sua senha" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="confirmarPassword"
              label="Confirmar Senha"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Por favor, confirme sua senha.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error('As senhas nao coincidem.'));
                  },
                }),
              ]}
            >
              <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Confirme a senha" />
            </Form.Item>
          </Col>
        </Row>

        <GoogleRecaptcha
          ref={recaptchaRef}
          siteKey={recaptchaSiteKey}
          onTokenChange={handleCaptchaChange}
          theme="light"
        />

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<UserAddOutlined />}
            size="large"
            loading={loading}
            disabled={!isRecaptchaConfigured || !captchaToken}
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Criar Conta
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};
