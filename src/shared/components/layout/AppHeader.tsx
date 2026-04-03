import React from 'react';
import { Layout, Typography, Avatar, Space, Dropdown, Button, Tooltip, Breadcrumb } from 'antd';
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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../../core/services/authService';
import type { User } from '../../../core/services/authService';
import { subscribeUserUpdated } from '../../../core/events/userObserver';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDrawer } from './NotificationDrawer';
import { useGlobalAiDrawer } from '../../../features/ai/context/GlobalAiDrawerContext';

const { Header } = Layout;

const SEGMENT_LABELS: Record<string, string> = {
  '': 'Início',
  acompanhamento: 'Acompanhamento',
  'acompanhamento-servicos': 'Acompanhamento',
  cadastros: 'Cadastros',
  orcamentos: 'Orçamentos',
  servicos: 'Serviços',
  prestadores: 'Prestadores',
  profile: 'Meu Perfil',
  notificacoes: 'Notificações',
  obras: 'Obras',
  processos: 'Processos Adm',
  clcb: 'CLCB',
  avcb: 'AVCB',
  lancamentos: 'Lançamentos',
  'custos-indiretos': 'Custos Indiretos',
  'gestao-de-clientes': 'Clientes',
  'gestao-ads': 'Gestão ADS',
  chat: 'Chat',
  novo: 'Novo',
  editar: 'Editar',
};

const isLikelyIdSegment = (segment: string) =>
  /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

const toTitleCase = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const resolveSegmentLabel = (segment: string) => {
  if (isLikelyIdSegment(segment)) {
    return 'Detalhe';
  }
  return SEGMENT_LABELS[segment] ?? toTitleCase(segment);
};

const getShortUserLabel = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.includes('@')) {
    return raw.split('@')[0] || raw;
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const second = parts[1]!;
  return `${first} ${second[0]}.`;
};

interface AppHeaderProps {
  collapsed: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  isMobile?: boolean;
  sideBarWidth: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  setCollapsed,
  isMobile,
  sideBarWidth,
  isDarkMode,
  toggleTheme,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleDrawer } = useGlobalAiDrawer();
  const [user, setUser] = React.useState<User | null>(authService.getCurrentUser());
  const [isElevated, setIsElevated] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = subscribeUserUpdated((updatedUser) => {
      setUser(updatedUser);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const update = () => setIsElevated((window.scrollY || 0) > 4);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
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
  const shortUserName = getShortUserLabel(userName);
  const profilePicture = user?.profilePictureUrl ?? undefined;

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

  const breadcrumbItems = React.useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items: { title: React.ReactNode }[] = [
      { title: <Link to="/">{SEGMENT_LABELS['']}</Link> },
    ];

    let accumulated = '';
    segments.forEach((segment, index) => {
      accumulated += `/${segment}`;
      const label = resolveSegmentLabel(segment);
      const isLast = index === segments.length - 1;
      items.push({
        title: isLast ? <span>{label}</span> : <Link to={accumulated}>{label}</Link>,
      });
    });

    return items;
  }, [location.pathname]);

  const pageTitle = React.useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (!segments.length) {
      return 'Insights';
    }

    const last = segments[segments.length - 1] || '';
    const label = resolveSegmentLabel(last);
    const first = resolveSegmentLabel(segments[0] || '');

    if (label === 'Novo' || label === 'Editar') {
      return `${label} • ${first}`;
    }

    return label;
  }, [location.pathname]);

  return (
    <Header
      style={{
        position: 'fixed',
        zIndex: 1000,
        width: headerWidth,
        padding: isMobile ? '0 12px' : '0 18px',
        right: 0,
      }}
      className={[
        'atlas-app-header',
        isDarkMode ? 'atlas-app-header--dark' : 'atlas-app-header--light',
        isElevated ? 'atlas-app-header--elevated' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="atlas-app-header__left">
        <Tooltip title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed?.(!collapsed)}
            className="atlas-header-icon-btn"
            style={{ ...iconButtonStyle, fontSize: 16 }}
          />
        </Tooltip>

        <div className="atlas-app-header__meta">
          {!isMobile ? (
            <Breadcrumb className="atlas-app-header__breadcrumb" items={breadcrumbItems} />
          ) : null}
          <Typography.Text className="atlas-app-header__title" strong ellipsis>
            {pageTitle}
          </Typography.Text>
        </div>
      </div>

      {!isMobile ? (
        <div className="atlas-app-header__search">
          <GlobalSearch />
        </div>
      ) : null}

      <div className="atlas-app-header__actions">
        {!isMobile && (
          <Tooltip title="Ajuda">
            <Button
              type="text"
              icon={<QuestionCircleOutlined style={{ fontSize: '18px' }} />}
              className="atlas-header-icon-btn"
              style={iconButtonStyle}
            />
          </Tooltip>
        )}

        <Tooltip title="Atlas AI">
          <Button
            type="text"
            icon={<RobotOutlined style={{ fontSize: '18px', color: '#4285F4' }} />}
            className="atlas-header-icon-btn"
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
            className="atlas-header-icon-btn"
            style={iconButtonStyle}
            onClick={toggleTheme}
          />
        </Tooltip>

        <Dropdown menu={{ items: profileMenuItems, onClick: handleProfileMenuClick }} placement="bottomRight" trigger={['click']}>
          <Space className="atlas-app-header__user" style={{ cursor: 'pointer', marginLeft: isMobile ? 0 : '4px' }}>
            <Avatar 
              size={isMobile ? 'small' : 'default'} 
              icon={<UserOutlined />} 
              src={profilePicture}
            />
            {!isMobile && (
              <Typography.Text className="atlas-app-header__user-name" strong ellipsis>
                {shortUserName}
              </Typography.Text>
            )}
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};
