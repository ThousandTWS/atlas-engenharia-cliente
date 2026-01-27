import React from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Login values:', values);
    // Simulação de login bem-sucedido
    message.success('Login realizado com sucesso!');
    navigate('/');
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
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="login"
            rules={[{ required: true, message: 'Por favor, insira seu usuário ou e-mail!' }]}
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
            <Row justify="space-between" align="middle">
              <Col>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Lembrar-me</Checkbox>
                </Form.Item>
              </Col>
              <Col>
                <Link to="/auth/forgot-password" style={{ fontSize: '14px' }}>
                  Esqueci minha senha
                </Link>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<LoginOutlined />} size="large">
              Entrar
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            Não tem uma conta? <Link to="/auth/register">Registre-se agora!</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};
