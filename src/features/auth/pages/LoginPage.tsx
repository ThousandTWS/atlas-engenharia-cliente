import React, { useState } from 'react';
import { Typography, Button, Form, Input, App } from 'antd';
import { LoginOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';
import { GoogleRecaptcha, type GoogleRecaptchaHandle } from '../components/GoogleRecaptcha';

const { Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = React.useRef<GoogleRecaptchaHandle>(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? '6LduFpksAAAAAKykJOtL_V6ALwQ7mSn0cTd4usE6';
  const isRecaptchaConfigured = Boolean(recaptchaSiteKey);
  const handleCaptchaChange = React.useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

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
      await authService.login({
        login: values.username,
        password: values.password,
        recaptchaToken: captchaToken,
      });
      message.success('Login realizado com sucesso!');

      setTimeout(() => {
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }, 100);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar login. Tente novamente.';
      message.error(errorMessage);
      recaptchaRef.current?.reset();
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
          <div className="atlas-auth-inline-actions">
            <Text className="atlas-auth-footer-text">Nao possui conta?</Text>
            <Link to="/auth/register" className="atlas-auth-link">Criar conta</Link>
          </div>
          <div className="atlas-auth-inline-actions">
            <Link to="/auth/forgot-password" className="atlas-auth-link">Esqueci minha senha</Link>
          </div>
        </>
      )}
    >
      <Form name="login" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="username"
          label="Usuario ou E-mail"
          rules={[{ required: true, message: 'Por favor, insira seu usuario ou e-mail.' }]}
        >
          <Input className="atlas-form-input" prefix={<UserOutlined />} placeholder="usuario@empresa.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Senha"
          rules={[{ required: true, message: 'Por favor, insira sua senha.' }]}
        >
          <Input.Password className="atlas-form-input" prefix={<LockOutlined />} placeholder="Sua senha de acesso" />
        </Form.Item>

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
            icon={<LoginOutlined />}
            loading={loading}
            disabled={!isRecaptchaConfigured || !captchaToken}
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
