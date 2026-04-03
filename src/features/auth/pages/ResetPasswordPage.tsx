import React, { useMemo, useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, SafetyOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService, type ResetPasswordDTO } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

export const ResetPasswordPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const initialEmail = useMemo(() => {
    const state = location.state as { email?: string } | null;
    return state?.email ?? '';
  }, [location.state]);

  const onFinish = async (values: ResetPasswordDTO) => {
    setLoading(true);
    try {
      await authService.resetPassword(values);
      message.success('Senha redefinida com sucesso! Faça login para continuar.');
      navigate('/auth/login', { replace: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao redefinir senha.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Recuperação"
      title="Redefinir senha"
      subtitle="Informe o código e defina uma nova senha."
      footer={(
        <div className="atlas-auth-inline-actions">
          <Text className="atlas-auth-footer-text">Voltar para</Text>
          <Link to="/auth/login" className="atlas-auth-link">Login</Link>
        </div>
      )}
    >
      <Form
        name="reset_password"
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

        <Form.Item
          name="newPassword"
          label="Nova senha"
          rules={[
            { required: true, message: 'Informe a nova senha.' },
            { min: 6, message: 'A senha deve ter pelo menos 6 caracteres.' },
          ]}
        >
          <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Nova senha" />
        </Form.Item>

        <Form.Item
          name="confirmNewPassword"
          label="Confirmar nova senha"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Confirme a nova senha.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('As senhas não coincidem.'));
              },
            }),
          ]}
        >
          <Input.Password className="atlas-form-input" prefix={<KeyOutlined />} placeholder="Confirme a nova senha" />
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
            Redefinir senha
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};

