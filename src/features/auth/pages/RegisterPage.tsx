import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, UserAddOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      console.log('Enviando dados de registro:', values);
      
      await authService.register(values);
      message.success('Conta criada com sucesso! Verifique seu e-mail.');
      // Após registro, o usuário geralmente precisa validar o e-mail
      navigate('/auth/verify-email', { state: { email: values.email } });
    } catch (error: any) {
      message.error('Erro ao realizar cadastro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f0f2f5',
      padding: '40px 0'
    }}>
      <Card style={{ width: 500, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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
          <Title level={2} style={{ color: '#1890ff', marginBottom: 0 }}>Atlas</Title>
          <Text type="secondary">Crie sua conta para começar</Text>
        </div>
        
        <Form
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="nomeCompleto"
                label="Nome Completo"
                rules={[{ required: true, message: 'Por favor, insira seu nome completo!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Ex: João da Silva" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="Usuário"
                rules={[{ required: true, message: 'Por favor, insira um nome de usuário!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="usuario123" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="telefone"
                label="Telefone"
                rules={[{ required: true, message: 'Por favor, insira seu telefone!' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
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
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="confirmarEmail"
                label="Confirmar E-mail"
                dependencies={['email']}
                rules={[
                  { required: true, message: 'Por favor, confirme seu e-mail!' },
                  { type: 'email', message: 'Por favor, insira um e-mail válido!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('email') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Os e-mails não coincidem!'));
                    },
                  }),
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Confirme seu e-mail" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label="Senha"
                rules={[
                  { required: true, message: 'Por favor, insira sua senha!' },
                  { min: 6, message: 'A senha deve ter pelo menos 6 caracteres!' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Sua senha" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="confirmarPassword"
                label="Confirmar Senha"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Por favor, confirme sua senha!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('As senhas não coincidem!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirme a senha" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block icon={<UserAddOutlined />} size="large" loading={loading}>
              Criar Conta
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            Já tem uma conta? <Link to="/auth/login">Faça login!</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};
