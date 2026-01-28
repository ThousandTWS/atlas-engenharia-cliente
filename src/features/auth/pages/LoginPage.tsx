import React, { useState } from 'react';
import { Card, Typography, Button, Form, Input, App } from 'antd';
import { LoginOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Redireciona se já estiver autenticado
  React.useEffect(() => {
    const isAuth = authService.isAuthenticated();
    console.log('LoginPage: useEffect check auth', { isAuth });
    if (isAuth) {
      console.log('LoginPage: User is authenticated, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await authService.login({
        login: values.username,
        password: values.password
      });
      console.log('Login successful, response:', response);
      message.success('Login realizado com sucesso!');
      
      // Pequeno delay para garantir que o localStorage seja propagado se houver concorrência
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || '/';
        console.log('Redirecting to:', from);
        navigate(from, { replace: true });
      }, 100);
    } catch (error: any) {
      console.error('Login error details:', error);
      message.error(error.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 0 }}>Atlas</Title>
          <Text type="secondary">Engenharia & Gestão</Text>
        </div>

        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>Acessar Sistema</Title>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Por favor, insira seu usuário!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Usuário ou E-mail" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              icon={<LoginOutlined />}
              loading={loading}
            >
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Use suas credenciais para acessar o sistema
          </Text>
          <div style={{ marginTop: 8 }}>
            Não tem uma conta? <Link to="/auth/register" style={{ color: '#1890ff' }}>Cadastre-se!</Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
