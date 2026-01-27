import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const onFinish = (values: any) => {
    console.log('Verify email values:', values);
    message.success('E-mail validado com sucesso! Você já pode fazer login.');
    navigate('/auth/login');
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
          <Title level={3} style={{ marginBottom: 8 }}>Validar E-mail</Title>
          <Text type="secondary">
            Insira o código de verificação que enviamos para o seu e-mail.
          </Text>
        </div>
        
        <Form
          name="verify_email_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{ email: initialEmail }}
        >
          <Form.Item
            name="email"
            label="E-mail"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Código de Verificação"
            rules={[{ required: true, message: 'Por favor, insira o código!' }]}
          >
            <Input prefix={<SafetyCertificateOutlined />} placeholder="Ex: 123456" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block icon={<CheckCircleOutlined />} size="large">
              Validar Cadastro
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            Não recebeu o código? <Button type="link" style={{ padding: 0 }}>Reenviar e-mail</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
