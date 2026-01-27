import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Upload,
  message,
  Divider,
  Breadcrumb,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UploadOutlined,
  SaveOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const [personalForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const onUpdateProfile = (values: any) => {
    setLoading(true);
    console.log('Update profile:', values);
    setTimeout(() => {
      message.success('Perfil atualizado com sucesso!');
      setLoading(false);
    }, 1000);
  };

  const onChangePassword = (values: any) => {
    setLoading(true);
    console.log('Change password:', values);
    setTimeout(() => {
      message.success('Senha alterada com sucesso!');
      passwordForm.resetFields();
      setLoading(false);
    }, 1000);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/profile/photo', // Endpoint fictício
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'uploading') {
        setLoading(true);
        return;
      }
      if (info.file.status === 'done' || info.file.status === 'error') {
        // Simulação de sucesso
        message.success(`${info.file.name} foto de perfil atualizada.`);
        setLoading(false);
        // Em um app real, o backend retornaria a URL
        setProfilePic(URL.createObjectURL(info.file.originFileObj as any));
      }
    },
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Usuário' },
          { title: 'Meu Perfil' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Title level={2}>Meu Perfil</Title>
      <Text type="secondary">Gerencie suas informações pessoais e segurança da conta.</Text>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center', borderRadius: 8 }}>
            <Avatar 
              size={120} 
              icon={<UserOutlined />} 
              src={profilePic}
              style={{ marginBottom: 16, border: '4px solid #f0f2f5' }}
            />
            <Title level={4} style={{ margin: 0 }}>Admin Atlas</Title>
            <Text type="secondary">Administrador do Sistema</Text>
            
            <Divider />
            
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} block>Alterar Foto</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: '12px' }}>
              JPG, PNG ou GIF. Máximo de 2MB.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card style={{ borderRadius: 8 }}>
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab={<span><UserOutlined /> Dados Pessoais</span>} key="1">
                <Form
                  form={personalForm}
                  layout="vertical"
                  onFinish={onUpdateProfile}
                  initialValues={{
                    nomeCompleto: 'Admin Atlas',
                    email: 'admin@atlasengenharia.com',
                    username: 'admin',
                    telefone: '(11) 99999-9999',
                  }}
                  style={{ marginTop: 16 }}
                >
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="nomeCompleto"
                        label="Nome Completo"
                        rules={[{ required: true, message: 'Insira seu nome completo' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="Seu nome completo" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label="E-mail"
                        rules={[
                          { required: true, message: 'Insira seu e-mail' },
                          { type: 'email', message: 'E-mail inválido' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="telefone"
                        label="Telefone"
                      >
                        <Input prefix={<PhoneOutlined />} placeholder="(00) 00000-0000" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="username"
                        label="Nome de Usuário"
                      >
                        <Input disabled prefix={<UserOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    htmlType="submit" 
                    loading={loading}
                  >
                    Salvar Alterações
                  </Button>
                </Form>
              </Tabs.TabPane>

              <Tabs.TabPane tab={<span><LockOutlined /> Segurança</span>} key="2">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={onChangePassword}
                  style={{ marginTop: 16 }}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Senha Atual"
                    rules={[{ required: true, message: 'Insira sua senha atual' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Sua senha atual" />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="newPassword"
                        label="Nova Senha"
                        rules={[
                          { required: true, message: 'Insira a nova senha' },
                          { min: 6, message: 'Mínimo de 6 caracteres' }
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 6 caracteres" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="confirmNewPassword"
                        label="Confirmar Nova Senha"
                        dependencies={['newPassword']}
                        rules={[
                          { required: true, message: 'Confirme a nova senha' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('As senhas não coincidem'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined />} placeholder="Repita a nova senha" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Button 
                    type="primary" 
                    icon={<LockOutlined />} 
                    htmlType="submit" 
                    loading={loading}
                    danger
                  >
                    Alterar Senha
                  </Button>
                </Form>
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
