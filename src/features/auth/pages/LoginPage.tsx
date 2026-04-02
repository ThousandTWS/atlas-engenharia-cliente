import React, { useState } from 'react';
import { Typography, Button, Form, Input, App } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

interface LoginFormValues {
  workshopSlug: string;
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      if (isAuth && isMounted) {
        navigate('/', { replace: true });
        return;
      }

      const hydrated = await authService.hydrateSession();
      if (hydrated && isMounted) {
        navigate('/', { replace: true });
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await authService.login({
        workshopSlug: values.workshopSlug,
        email: values.email,
        password: values.password,
      });
      message.success('Login realizado com sucesso!');

      setTimeout(() => {
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }, 100);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar login. Tente novamente.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Autenticacao"
      title="Acessar Plataforma"
      subtitle="Entre com suas credenciais corporativas para continuar."
      footer={(
        <>
          <div className="prevent-auth-inline-actions">
            <Text className="prevent-auth-footer-text">Nao possui conta?</Text>
            <Link to="/auth/signup" className="prevent-auth-link">Criar oficina</Link>
          </div>
        </>
      )}
    >
      <Form name="login" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="workshopSlug"
          label="Oficina"
          rules={[{ required: true, message: 'Informe o slug da oficina.' }]}
        >
          <Input className="prevent-form-input" placeholder="oficina-centro" autoCapitalize="none" autoCorrect="off" />
        </Form.Item>

        <Form.Item
          name="email"
          label="E-mail"
          rules={[
            { required: true, message: 'Por favor, insira seu e-mail.' },
            { type: 'email', message: 'E-mail inválido.' },
          ]}
        >
          <Input className="prevent-form-input" placeholder="ana@oficinacentro.com" autoCapitalize="none" autoCorrect="off" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Senha"
          rules={[{ required: true, message: 'Por favor, insira sua senha.' }]}
        >
          <Input.Password className="prevent-form-input" prefix={<LockOutlined />} placeholder="Sua senha de acesso" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<LoginOutlined />}
            loading={loading}
            size="large"
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Entrar
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};
