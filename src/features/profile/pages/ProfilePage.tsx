/* eslint-disable @typescript-eslint/no-explicit-any */
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
  CheckCircleOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { authService } from '../../../core/services/authService';
import type { User } from '../../../core/services/authService';
import apiClient from '../../../core/api/apiClient';
import { API_BASE_URL } from '../../../core/api/apiClient';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { normalizePhoneBR } from '../../../shared/utils/inputFormat';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode, isMobile } = useLayout();
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

        authService.setCurrentUser(data);
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
    action: `${API_BASE_URL || ''}/profile/photo`,
    withCredentials: true,
    headers: {
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
        let imageUrl = info.file.response;
        
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

  const palette = isDarkMode
    ? {
        border: '#27324A',
        surface: '#0B111D',
        panel: '#0F172A',
        hero: 'linear-gradient(130deg, #0B1324 0%, #0A1020 48%, #172139 100%)',
        mutedText: '#94A3B8',
        strongText: '#E2E8F0',
      }
    : {
        border: '#DCE3EE',
        surface: '#FFFFFF',
        panel: '#F8FAFC',
        hero: 'linear-gradient(130deg, #F8FAFF 0%, #EEF3FB 48%, #E5ECF8 100%)',
        mutedText: '#64748B',
        strongText: '#1E293B',
      };

  const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : 'Usuário';
  const accountLabel = user?.enabled ? 'Conta ativa' : 'Conta pendente';

  const primaryCardStyle = {
    borderRadius: 8,
    borderColor: palette.border,
    background: palette.surface,
    boxShadow: isDarkMode ? '0 12px 30px #00000040' : '0 10px 28px #0f172a14',
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <UserOutlined /> Dados Pessoais
        </span>
      ),
      children: (
        <Form
          form={personalForm}
          layout="vertical"
          onFinish={onUpdateProfile}
          initialValues={user || {}}
          style={{ marginTop: 12 }}
        >
          <Row gutter={[16, 0]}>
            <Col span={24}>
              <Form.Item
                name="nomeCompleto"
                label="Nome Completo"
                rules={[{ required: true, message: 'Insira seu nome completo' }]}
              >
                <Input
                  size="large"
                  className="atlas-form-input"
                  prefix={<UserOutlined />}
                  placeholder="Seu nome completo"
                />
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
                <Input
                  size="large"
                  className="atlas-form-input"
                  prefix={<MailOutlined />}
                  placeholder="seu@email.com"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telefone" label="Telefone" normalize={normalizePhoneBR}>
                <Input
                  size="large"
                  className="atlas-form-input"
                  prefix={<PhoneOutlined />}
                  placeholder="(00) 00000-0000"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="username" label="Nome de Usuário">
                <Input size="large" className="atlas-form-input" disabled prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={loading}
            style={{ minWidth: 180, height: 42, borderRadius: 8, fontWeight: 600 }}
          >
            Salvar Alterações
          </Button>
        </Form>
      ),
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <LockOutlined /> Segurança
        </span>
      ),
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={onChangePassword}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            name="currentPassword"
            label="Senha Atual"
            rules={[{ required: true, message: 'Insira sua senha atual' }]}
          >
            <Input.Password
              size="large"
              className="atlas-form-input"
              prefix={<LockOutlined />}
              placeholder="Sua senha atual"
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="newPassword"
                label="Nova Senha"
                rules={[
                  { required: true, message: 'Insira a nova senha' },
                  { min: 6, message: 'Mínimo de 6 caracteres' },
                ]}
              >
                <Input.Password
                  size="large"
                  className="atlas-form-input"
                  prefix={<LockOutlined />}
                  placeholder="Mínimo 6 caracteres"
                />
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
                <Input.Password
                  size="large"
                  className="atlas-form-input"
                  prefix={<LockOutlined />}
                  placeholder="Repita a nova senha"
                />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            icon={<LockOutlined />}
            htmlType="submit"
            loading={loading}
            style={{ minWidth: 180, height: 42, borderRadius: 8, fontWeight: 600 }}
          >
            Alterar Senha
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          margin: isMobile ? '8px 8px 0' : '10px 16px 0',
          padding: isMobile ? '14px 14px 16px' : '18px 22px',
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          background: palette.hero,
        }}
      >
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: '/' },
            { title: 'Usuário' },
            { title: 'Meu Perfil' },
          ]}
          style={{ marginBottom: 10 }}
        />
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>Meu Perfil</Title>
            <Text type="secondary">Gerencie suas informações pessoais e segurança da conta.</Text>
          </Col>
          <Col>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
              <Tag
                icon={<CheckCircleOutlined />}
                style={{
                  marginInlineEnd: 0,
                  borderRadius: 999,
                  padding: '4px 10px',
                  borderColor: palette.border,
                  color: palette.strongText,
                  background: palette.panel,
                }}
              >
                {accountLabel}
              </Tag>
              <Tag
                icon={<IdcardOutlined />}
                style={{
                  marginInlineEnd: 0,
                  borderRadius: 999,
                  padding: '4px 10px',
                  borderColor: palette.border,
                  color: palette.strongText,
                  background: palette.panel,
                }}
              >
                {roleLabel}
              </Tag>
            </div>
          </Col>
        </Row>
      </div>

      <Row
        gutter={[16, 16]}
        align="stretch"
        style={{ margin: isMobile ? '12px 8px 0' : '14px 8px 0' }}
      >
        <Col xs={24} md={8} style={{ display: 'flex' }}>
          <Card
            style={{ ...primaryCardStyle, textAlign: 'center', width: '100%', height: '100%' }}
            styles={{ body: { padding: isMobile ? 18 : 22, height: '100%', display: 'flex', flexDirection: 'column' } }}
          >
            <Avatar 
              size={isMobile ? 104 : 120}
              icon={<UserOutlined />} 
              src={user?.profilePictureUrl}
              style={{
                alignSelf: 'center',
                marginBottom: 16,
                border: `3px solid ${palette.border}`,
                objectFit: 'cover',
                boxShadow: isDarkMode ? '0 0 0 6px #0A1221' : '0 0 0 6px #F8FAFC',
              }}
            />
            <Title level={4} style={{ margin: 0, color: palette.strongText }}>{user?.nomeCompleto || 'Usuário'}</Title>
            <Text style={{ display: 'block', marginBottom: 8, color: palette.mutedText }}>{user?.email}</Text>
            <Divider style={{ borderColor: palette.border, margin: '18px 0' }} />

            <div
              style={{
                textAlign: 'left',
                background: palette.panel,
                border: `1px solid ${palette.border}`,
                borderRadius: 8,
                padding: '12px',
                marginBottom: 14,
              }}
            >
              <Text style={{ display: 'block', fontSize: 12, color: palette.mutedText }}>Nome de usuário</Text>
              <Text style={{ color: palette.strongText, fontWeight: 500 }}>{user?.username || '-'}</Text>
              <Divider style={{ margin: '10px 0', borderColor: palette.border }} />
              <Text style={{ display: 'block', fontSize: 12, color: palette.mutedText }}>Telefone</Text>
              <Text style={{ color: palette.strongText, fontWeight: 500 }}>{user?.telefone || '-'}</Text>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <Upload {...uploadProps}>
                <Button
                  icon={<UploadOutlined />}
                  block
                  size="large"
                  loading={loading}
                  style={{ height: 42, borderRadius: 8, fontWeight: 600 }}
                >
                  Alterar Foto
                </Button>
              </Upload>
              <Text style={{ display: 'block', marginTop: 10, fontSize: '12px', color: palette.mutedText }}>
                JPG, PNG ou GIF. Máximo de 2MB.
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16} style={{ display: 'flex' }}>
          <Card
            style={{ ...primaryCardStyle, width: '100%', height: '100%' }}
            styles={{ body: { padding: isMobile ? 16 : 22, height: '100%' } }}
          >
            <Tabs
              defaultActiveKey="1"
              items={tabItems}
              tabBarStyle={{ marginBottom: 16, borderBottom: `1px solid ${palette.border}` }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
