import React from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

interface ResetPasswordFormValues {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email || '';
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    try {
      await authService.resetPassword(values);
      message.success('Senha redefinida com sucesso! Faca login com sua nova senha.');
      navigate('/auth/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao redefinir senha.';
      message.error(`Erro ao redefinir senha: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Seguranca"
      title="Definir Nova Senha"
      subtitle="Informe o codigo recebido e crie uma nova senha para sua conta."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Nao recebeu codigo?</Text>
          <Link to="/auth/forgot-password" className="atlas-auth-link">Solicitar novamente</Link>
        </div>
      )}
    >
      <Form
        name="reset_password_form"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        initialValues={{ email: initialEmail }}
      >
        <Form.Item
          name="email"
          label="E-mail"
          rules={[
            { required: true, message: 'Por favor, informe seu e-mail.' },
            { type: 'email', message: 'Por favor, insira um e-mail valido.' },
          ]}
        >
          <Input className="atlas-form-input" disabled={Boolean(initialEmail)} placeholder="seu@email.com" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Codigo de Verificacao"
          rules={[{ required: true, message: 'Insira o codigo enviado por e-mail.' }]}
        >
          <Input className="atlas-form-input" prefix={<SafetyCertificateOutlined />} placeholder="Ex: 123456" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Nova Senha"
          rules={[
            { required: true, message: 'Por favor, insira sua nova senha.' },
            { min: 6, message: 'A senha deve ter pelo menos 6 caracteres.' },
          ]}
        >
          <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Minimo de 6 caracteres" />
        </Form.Item>

        <Form.Item
          name="confirmNewPassword"
          label="Confirmar Nova Senha"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Por favor, confirme sua nova senha.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error('As senhas nao coincidem.'));
              },
            }),
          ]}
        >
          <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Confirme a nova senha" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<SaveOutlined />}
            size="large"
            loading={loading}
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Redefinir Senha
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};
