import React, { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, SendOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../../core/services/auth/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      message.success('Enviamos um código para seu e-mail.');
      navigate('/auth/reset-password', { replace: true, state: { email: values.email } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar redefinição de senha.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Recuperação"
      title="Esqueci minha senha"
      subtitle="Informe seu e-mail para receber um código de redefinição."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Lembrou a senha?</Text>
          <Link to="/auth/login" className="atlas-auth-link">Fazer login</Link>
        </div>
      )}
    >
      <Form name="forgot_password" onFinish={onFinish} layout="vertical" size="large">
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

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<SendOutlined />}
            loading={loading}
            size="large"
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Enviar código
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};

