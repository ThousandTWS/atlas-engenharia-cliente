import React, { useState, useEffect } from 'react';
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
  Divider,
  Breadcrumb,
  Tabs,
  App,
  Tag,
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
import apiClient, { API_URL } from '../../../core/api/apiClient';
import { authService } from '../../../core/services/authService';
import type { User } from '../../../core/services/authService';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const [personalForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('ProfilePage: Fetching profile data...');
        const response = await apiClient.get<User>('/profile');
        const data = response.data;
        console.log('ProfilePage: Profile data received from API:', data);
        personalForm.setFieldsValue(data);
        setUser(data);
        
        // Se por algum motivo o user no localStorage for nulo (não deveria estar aqui se for nulo), 
        // ou se quisermos garantir que os dados da API sobrescrevam tudo
        const currentLocalUser = authService.getCurrentUser();
        if (!currentLocalUser) {
           console.log('ProfilePage: No local user found, saving API data as initial user');
           localStorage.setItem('user', JSON.stringify(data));
           window.dispatchEvent(new Event('userUpdated'));
        } else {
           authService.updateLocalUser(data);
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error);
      }
    };
    fetchProfile();
  }, [personalForm]);

  const onUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      console.log('ProfilePage: Updating profile with values:', values);
      const response = await apiClient.put<User>('/profile', values);
      console.log('ProfilePage: Profile updated successfully:', response.data);
      message.success('Perfil atualizado com sucesso!');
      setUser(response.data);
      authService.updateLocalUser(response.data);
    } catch (error: any) {
      message.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (values: any) => {
    setLoading(true);
    try {
      await apiClient.put('/profile/change-password', values);
      message.success('Senha alterada com sucesso!');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: `${API_URL}/profile/photo`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'X-Requested-With': null as any,
    },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'uploading') {
        setLoading(true);
        return;
      }
      if (info.file.status === 'done') {
        message.success('Foto de perfil atualizada com sucesso!');
        setLoading(false);
        // O backend retorna a URL da imagem no body da resposta como uma string (conforme swagger sugerido)
        // Ou podemos recarregar o perfil
        let imageUrl = info.file.response;
        
        // Se a resposta for um objeto com campo url (comum em APIs reais)
        if (imageUrl && typeof imageUrl === 'object' && imageUrl.url) {
          imageUrl = imageUrl.url;
        }

        if (typeof imageUrl === 'string') {
          console.log('ProfilePage: Updating photo with URL:', imageUrl);
          const updatedUser = authService.updateLocalUser({ profilePictureUrl: imageUrl });
          if (updatedUser) setUser(updatedUser);
        } else {
          // Se não retornar a URL direto, vamos dar um GET /profile
          apiClient.get<User>('/profile').then(res => {
            console.log('ProfilePage: Fetched profile after photo upload:', res.data);
            setUser(res.data);
            authService.updateLocalUser(res.data);
          });
        }
      } else if (info.file.status === 'error') {
        message.error('Erro ao fazer upload da foto.');
        setLoading(false);
      }
    },
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined /> Dados Pessoais
        </span>
      ),
      children: (
        <Form
          form={personalForm}
          layout="vertical"
          onFinish={onUpdateProfile}
          initialValues={user || {}}
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
                  { type: 'email', message: 'E-mail inválido' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telefone" label="Telefone">
                <Input prefix={<PhoneOutlined />} placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="username" label="Nome de Usuário">
                <Input disabled prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
            Salvar Alterações
          </Button>
        </Form>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <LockOutlined /> Segurança
        </span>
      ),
      children: (
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
                  { min: 6, message: 'Mínimo de 6 caracteres' },
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
      ),
    },
  ];

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
              src={user?.profilePictureUrl}
              style={{ marginBottom: 16, border: '4px solid #f0f2f5', objectFit: 'cover' }}
            />
            <Title level={4} style={{ margin: 0 }}>{user?.nomeCompleto || 'Usuário'}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{user?.email}</Text>
            <Tag color="blue" style={{ marginTop: 8 }}>{user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</Tag>
            
            <Divider />
            
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} block loading={loading}>Alterar Foto</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: '12px' }}>
              JPG, PNG ou GIF. Máximo de 2MB.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card style={{ borderRadius: 8 }}>
            <Tabs defaultActiveKey="1" items={tabItems} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
