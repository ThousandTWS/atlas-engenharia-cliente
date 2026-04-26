import React, { useState } from 'react';
import { Button, Form, Input, App } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../core/services/auth/authService';
import { AuthShell } from '../components/AuthShell';

interface LoginFormValues {
  login: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
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
        login: values.login,
        password: values.password,
      });
      message.success('Login realizado com sucesso!');
      navigate('/', { replace: true });
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
        <div className="atlas-auth-inline-actions" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="atlas-auth-footer-text">Não possui conta?</span>
            <Link to="/auth/register" className="atlas-auth-link">Criar conta</Link>
          </span>
          <Link to="/auth/forgot-password" className="atlas-auth-link">Esqueci a senha</Link>
        </div>
      )}
    >
      <Form name="login" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="login"
          label="Login"
          rules={[
            { required: true, message: 'Por favor, insira seu login (usuário ou e-mail).' },
          ]}
        >
          <Input className="atlas-form-input" placeholder="seu.usuario ou seuemail@empresa.com" autoCapitalize="none" autoCorrect="off" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Senha"
          rules={[{ required: true, message: 'Por favor, insira sua senha.' }]}
        >
          <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Sua senha de acesso" />
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
