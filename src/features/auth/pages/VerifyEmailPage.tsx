import React, { useMemo, useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService, type VerifyEmailDTO } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

export const VerifyEmailPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const initialEmail = useMemo(() => {
    const state = location.state as { email?: string } | null;
    return state?.email ?? '';
  }, [location.state]);

  const onFinish = async (values: VerifyEmailDTO) => {
    setLoading(true);
    try {
      await authService.verifyEmail(values);
      message.success('E-mail validado com sucesso! Faça login para continuar.');
      navigate('/auth/login', { replace: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao validar e-mail.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Validação"
      title="Validar e-mail"
      subtitle="Informe o código enviado para o seu e-mail."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Já validou?</Text>
          <Link to="/auth/login" className="atlas-auth-link">Fazer login</Link>
        </div>
      )}
    >
      <Form
        name="verify_email"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        initialValues={{ email: initialEmail }}
      >
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

        <Form.Item
          name="code"
          label="Código"
          rules={[{ required: true, message: 'Informe o código recebido.' }]}
        >
          <Input className="atlas-form-input" prefix={<SafetyOutlined />} placeholder="123456" autoCapitalize="none" autoCorrect="off" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            size="large"
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Validar
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};

