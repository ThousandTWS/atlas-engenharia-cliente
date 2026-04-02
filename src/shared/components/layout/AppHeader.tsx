import React from 'react';
import { Layout, Typography, Avatar, Space, Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import type { User } from '../../../core/services/authService';
import { subscribeUserUpdated } from '../../../core/events/userObserver';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDrawer } from './NotificationDrawer';
import { useGlobalAiDrawer } from '../../../features/ai/context/GlobalAiDrawerContext';

const { Header } = Layout;
interface AppHeaderProps {
  collapsed: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  isMobile?: boolean;
  sideBarWidth: number;
  isDarkMode: boolean;
  toggleTheme: ( ) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  setCollapsed,
  isMobile,
  sideBarWidth,
  isDarkMode,
  toggleTheme,
}) => {
  const navigate = useNavigate();
  const { toggleDrawer } = useGlobalAiDrawer();
  const [user, setUser] = React.useState<User | null>(authService.getCurrentUser());


  React.useEffect(() => {
    const unsubscribe = subscribeUserUpdated((updatedUser) => {
      setUser(updatedUser);
    });
    return unsubscribe;
  }, []);

  const handleProfileMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'logout') {
      await authService.logout();
      navigate('/auth/login');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  const userName = user?.fullName || user?.email || 'Admin';
  const profilePicture = user?.profilePhotoUrl ?? undefined;

  const iconButtonStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

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

  const headerWidth = isMobile ? '100%' : `calc(100% - ${sideBarWidth}px)`;

  return (
    <Header
      style={{
        position: 'fixed',
        zIndex: 1000,
        width: headerWidth,
        padding: isMobile ? '0 12px' : '0 24px',
        background: isDarkMode ? '#141B2D' : '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E140',
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
        <div
          style={{
            display: isMobile && !collapsed ? 'none' : 'block',
            minWidth: isMobile ? 0 : 12,
          }}
        />
      </div>

      {!isMobile && <GlobalSearch />}

      <Space size={isMobile ? 10 : 14} style={{ marginLeft: 'auto', alignItems: 'center' }} wrap>
        {!isMobile && (
          <Tooltip title="Ajuda">
            <Button
              type="text"
              icon={<QuestionCircleOutlined style={{ fontSize: '18px' }} />}
              style={iconButtonStyle}
            />
          </Tooltip>
        )}

        <Tooltip title="Prevent AI">
          <Button
            type="text"
            icon={<RobotOutlined style={{ fontSize: '18px', color: '#4285F4' }} />}
            style={iconButtonStyle}
            onClick={toggleDrawer}
          />
        </Tooltip>

        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <NotificationDrawer />
        </span>

        <Tooltip title={isDarkMode ? 'Tema claro' : 'Tema escuro'}>
          <Button
            type="text"
            icon={isDarkMode ? <SunOutlined style={{ fontSize: '18px' }} /> : <MoonOutlined style={{ fontSize: '18px' }} />}
            style={iconButtonStyle}
            onClick={toggleTheme}
          />
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
