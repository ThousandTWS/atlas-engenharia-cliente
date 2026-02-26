import React from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

interface VerifyEmailFormValues {
  email: string;
  code: string;
}

export const VerifyEmailPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email || '';

  const [form] = Form.useForm<VerifyEmailFormValues>();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: VerifyEmailFormValues) => {
    setLoading(true);
    try {
      await authService.verifyEmail({
        email: values.email,
        code: values.code,
      });
      message.success('E-mail validado com sucesso! Voce ja pode fazer login.');
      navigate('/auth/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao validar e-mail.';
      message.error(`Erro ao validar e-mail: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    message.info('Para reenviar o codigo de validacao, realize um novo cadastro com o mesmo e-mail.');
  };

  return (
    <AuthShell
      contextLabel="Validacao"
      title="Validar E-mail"
      subtitle="Digite o codigo recebido para concluir a ativacao da conta."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Ja validou sua conta?</Text>
          <Link to="/auth/login" className="atlas-auth-link">Ir para login</Link>
        </div>
      )}
    >
      <Form
        form={form}
        name="verify_email_form"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        initialValues={{ email: initialEmail }}
      >
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

        <Form.Item
          name="code"
          label="Codigo de Verificacao"
          rules={[{ required: true, message: 'Por favor, insira o codigo.' }]}
        >
          <Input className="atlas-form-input" prefix={<SafetyCertificateOutlined />} placeholder="Ex: 123456" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<CheckCircleOutlined />}
            size="large"
            loading={loading}
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Validar Cadastro
          </Button>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleResend}
            className="atlas-auth-secondary-action"
          >
            Reenviar codigo
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};
