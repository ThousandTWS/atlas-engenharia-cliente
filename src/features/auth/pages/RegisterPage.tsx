import React, { useState } from 'react';
import { Form, Input, Button, Typography, App, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ShopOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import type { SignupDTO } from '../../../core/services/authService';
import { AuthShell } from '../components/AuthShell';

const { Text } = Typography;

export const RegisterPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: SignupDTO & { confirmOwnerPassword?: string }) => {
    setLoading(true);
    try {
      if (values.confirmOwnerPassword && values.ownerPassword !== values.confirmOwnerPassword) {
        message.error('As senhas não coincidem.');
        return;
      }

      await authService.signup(values);
      message.success('Oficina criada com sucesso!');
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar cadastro.';
      message.error(`Erro ao realizar cadastro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contextLabel="Cadastro"
      title="Criar Oficina"
      subtitle="Crie a oficina e o usuário proprietário para começar."
      footer={(
        <div className="prevent-auth-inline-actions">
          <Text className="prevent-auth-footer-text">Ja possui conta?</Text>
          <Link to="/auth/login" className="prevent-auth-link">Fazer login</Link>
        </div>
      )}
    >
      <Form name="register_form" onFinish={onFinish} layout="vertical" size="large">
        <Row gutter={14}>
          <Col span={24}>
            <Form.Item
              name="workshopName"
              label="Nome da Oficina"
              rules={[{ required: true, message: 'Informe o nome da oficina.' }]}
            >
              <Input className="prevent-form-input" prefix={<ShopOutlined />} placeholder="Oficina Centro" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="workshopSlug"
              label="Slug da Oficina"
              rules={[{ required: true, message: 'Informe o slug da oficina.' }]}
            >
              <Input className="prevent-form-input" placeholder="oficina-centro" autoCapitalize="none" autoCorrect="off" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="ownerName"
              label="Nome do Proprietário"
              rules={[{ required: true, message: 'Informe o nome do proprietário.' }]}
            >
              <Input className="prevent-form-input" prefix={<UserOutlined />} placeholder="Ana Souza" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="ownerEmail"
              label="E-mail do Proprietário"
              rules={[
                { required: true, message: 'Por favor, insira seu e-mail.' },
                { type: 'email', message: 'Por favor, insira um e-mail valido.' },
              ]}
            >
              <Input className="prevent-form-input" prefix={<MailOutlined />} placeholder="ana@oficinacentro.com" autoCapitalize="none" autoCorrect="off" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="ownerPassword"
              label="Senha do Proprietário"
              rules={[
                { required: true, message: 'Por favor, insira sua senha.' },
                { min: 6, message: 'A senha deve ter pelo menos 6 caracteres.' },
              ]}
            >
              <Input.Password className="prevent-form-input" prefix={<LockOutlined />} placeholder="Senha" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="confirmOwnerPassword"
              label="Confirmar Senha"
              dependencies={['ownerPassword']}
              rules={[
                { required: true, message: 'Por favor, confirme sua senha.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('ownerPassword') === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error('As senhas nao coincidem.'));
                  },
                }),
              ]}
            >
              <Input.Password className="prevent-form-input" prefix={<LockOutlined />} placeholder="Confirme a senha" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<UserAddOutlined />}
            size="large"
            loading={loading}
            style={{ height: 44, borderRadius: 8, fontWeight: 600 }}
          >
            Criar Oficina
          </Button>
        </Form.Item>
      </Form>
    </AuthShell>
  );
};
