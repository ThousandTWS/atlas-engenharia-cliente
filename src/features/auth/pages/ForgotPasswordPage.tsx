import React from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      message.success('Se o e-mail estiver cadastrado, enviaremos um codigo de recuperacao.');
      navigate('/auth/reset-password', { state: { email: values.email } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar recuperacao.';
      message.error(`Erro ao solicitar recuperacao: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Recuperacao"
      title="Recuperar Senha"
      subtitle="Informe seu e-mail corporativo para receber o codigo de redefinicao."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Lembrou a senha?</Text>
          <Link to="/auth/login" className="atlas-auth-link">Acessar plataforma</Link>
        </div>
      )}
    >
      <Form name="forgot_password_form" onFinish={onFinish} layout="vertical" size="large">
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

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<SendOutlined />}
            size="large"
            loading={loading}
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Enviar Codigo
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};
