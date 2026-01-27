import React from 'react';
import { Divider, Layout, Menu, theme, Drawer } from 'antd';
import type { MenuProps } from 'antd';
import {
  PieChartOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  BuildOutlined,
  TransactionOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface AppSiderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile?: boolean;
}

export const AppSider: React.FC<AppSiderProps> = ({ collapsed, setCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems: MenuItem[] = [
    {
      key: 'main-group',
      type: 'group',
      label: 'Principal',
      children: [
        {
          key: '/',
          icon: <PieChartOutlined />,
          label: 'Insights',
        },
        {
          key: '/processos',
          icon: <AppstoreOutlined />,
          label: 'Gestão de Processos',
        },
      ]
    },
    {
      type: 'divider',
    },
    {
      key: 'painéis-group',
      type: 'group',
      label: 'Painéis e Gestão',
      children: [
        {
          key: '/clcb',
          icon: <SafetyCertificateOutlined />,
          label: 'Painel CLCB',
        },
        {
          key: '/avcb',
          icon: <FireOutlined />,
          label: 'Painel AVCB',
        },
        {
          key: '/obras',
          icon: <BuildOutlined />,
          label: 'Painel de Obras',
        },
      ]
    },
    {
      key: 'financeiro-group',
      type: 'group',
      label: 'Financeiro',
      children: [
        {
          key: '/lancamentos',
          icon: <TransactionOutlined />,
          label: 'Lançamentos',
        },
        {
          key: '/custos-indiretos',
          icon: <WalletOutlined />,
          label: 'Custos Indiretos',
        },
      ]
    }
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const menuContent = (
    <>
      <div style={{ height: 32, margin: 16, background: 'rgba(0, 0, 0, 0.05)', borderRadius: 6 }} />
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
      <Divider style={{ margin: '5px 0' }} />
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={() => setCollapsed(true)}
        open={!collapsed}
        styles={{ body: { padding: 0 } }}
        width={250}
      >
        {menuContent}
      </Drawer>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: colorBgContainer,
        borderRight: '1px solid #f0f0f0',
        zIndex: 1001,
      }}
    >
      {menuContent}
    </Sider>
  );
};
