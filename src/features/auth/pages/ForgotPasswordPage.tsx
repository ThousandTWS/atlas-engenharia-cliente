import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    console.log('Forgot password values:', values);
    message.success('Se o e-mail estiver cadastrado, você receberá um código de recuperação.');
    navigate('/auth/reset-password', { state: { email: values.email } });
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
        <div style={{ marginBottom: 24 }}>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/auth/login')}
            style={{ padding: 0 }}
          >
            Voltar para o login
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>Recuperar Senha</Title>
          <Text type="secondary">
            Insira seu e-mail para receber as instruções de recuperação.
          </Text>
        </div>
        
        <Form
          name="forgot_password_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: 'Por favor, insira seu e-mail!' },
              { type: 'email', message: 'Por favor, insira um e-mail válido!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block icon={<SendOutlined />} size="large">
              Enviar Instruções
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
