import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const onFinish = (values: any) => {
    console.log('Reset password values:', values);
    message.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
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
          <Title level={3} style={{ marginBottom: 8 }}>Nova Senha</Title>
          <Text type="secondary">
            Insira o código recebido por e-mail e sua nova senha.
          </Text>
        </div>
        
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
            rules={[{ required: true, type: 'email' }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="code"
            label="Código de Verificação"
            rules={[{ required: true, message: 'Insira o código enviado por e-mail!' }]}
          >
            <Input prefix={<SafetyCertificateOutlined />} placeholder="Ex: 123456" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Nova Senha"
            rules={[
              { required: true, message: 'Por favor, insira sua nova senha!' },
              { min: 6, message: 'A senha deve ter pelo menos 6 caracteres!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 6 caracteres" />
          </Form.Item>

          <Form.Item
            name="confirmNewPassword"
            label="Confirmar Nova Senha"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Por favor, confirme sua nova senha!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('As senhas não coincidem!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirme a nova senha" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block icon={<SaveOutlined />} size="large">
              Redefinir Senha
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
