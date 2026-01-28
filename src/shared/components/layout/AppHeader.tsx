import React from 'react';
import { Layout, Typography, theme, Avatar, Space, Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import type { User } from '../../../core/services/authService';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDropdown } from './NotificationDropdown';

const { Header } = Layout;
const { Title } = Typography;

interface AppHeaderProps {
  collapsed: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  isMobile?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ collapsed, setCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(authService.getCurrentUser());
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  React.useEffect(() => {
    const handleUserUpdate = () => {
      const currentUser = authService.getCurrentUser();
      console.log('AppHeader: Received userUpdated event, current user:', currentUser);
      setUser(currentUser);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const handleProfileMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'logout') {
      await authService.logout();
      navigate('/auth/login');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  const userName = user?.nomeCompleto || user?.email || 'Admin';
  const profilePicture = user?.profilePictureUrl;

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Meu Perfil',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Configurações',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Sair',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const headerWidth = isMobile ? '100%' : `calc(100% - ${collapsed ? 80 : 200}px)`;

  return (
    <Header
      style={{
        position: 'fixed',
        zIndex: 1000,
        width: headerWidth,
        padding: isMobile ? '0 12px' : '0 24px',
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        transition: 'all 0.2s',
        right: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '24px', flex: 1, minWidth: 0 }}>
        {isMobile && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed?.(!collapsed)}
            style={{ fontSize: '16px', width: 40, height: 40 }}
          />
        )}
        <Title 
          level={isMobile ? 5 : 4} 
          style={{ 
            margin: 0, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: isMobile && !collapsed ? 'none' : 'block'
          }}
        >
          Atlas Engenharia
        </Title>
      </div>

      {!isMobile && <GlobalSearch />}

      <Space size={isMobile ? 8 : 20} style={{ marginLeft: 'auto' }}>
        {!isMobile && (
          <Tooltip title="Ajuda">
            <Button
              type="text"
              icon={<QuestionCircleOutlined style={{ fontSize: '18px' }} />}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
        )}

        <Tooltip title="Notificações">
          <NotificationDropdown />
        </Tooltip>

        <Dropdown menu={{ items: profileMenuItems, onClick: handleProfileMenuClick }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer', marginLeft: isMobile ? 0 : '4px' }}>
            <Avatar 
              size={isMobile ? 'small' : 'default'} 
              icon={<UserOutlined />} 
              src={profilePicture}
            />
            {!isMobile && <Typography.Text strong>{userName}</Typography.Text>}
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};
