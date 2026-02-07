import React from 'react';
  ConfigProvider
  ConfigProvider
import { Divider, Layout, Menu, Drawer, ConfigProvider } from 'antd';
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
  isDarkMode:boolean;
}

export const AppSider: React.FC<AppSiderProps> = ({ collapsed, setCollapsed, isMobile, isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          label: 'Processos Adm',
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
      type: 'divider',
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
  },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const menuContent = (
    <>

       <div style={{height:!collapsed ? 90 : 70,margin: '10px 0 3px 0', display:'flex', justifyContent:'center', padding: collapsed ? '0.4rem' :'1rem' }}>
          <img src={isDarkMode ?"/White_Atlas_Logo.svg" : "/Black_Atlas_Logo.svg"} alt="Logo" style={{ width: !collapsed ? '200px' : 100, transition: 'width 0.2s ease'  }} />
       </div>

       <ConfigProvider
            theme={{
                components: {
                        Menu: {
                                // Cor do titulo dos Grupos
                                groupTitleColor: isDarkMode ? '#FFFFFFD9' : '#1E293B',
                                // Cor dos itens
                                itemColor: isDarkMode ? '#FFFFFF' :'#1E293B' ,
                                itemSelectedColor:isDarkMode ? '#FFFFFF' : '#1E293B',
                                itemSelectedBg: isDarkMode ? '#FFFFFF0D' :'#CBD5E155',
                                itemHoverColor:isDarkMode ? '#FFFFFF' : '#1E293B'
                            }
                    }
                }}
       >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{background: isDarkMode ? "#141B2D" : '#F8FAFC',
            borderRight:'none',
        }}

        onClick={handleMenuClick}
      />

       </ConfigProvider>

      <Divider style={{ margin: '5px 0' }} />
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={() => setCollapsed(true)}
        open={!collapsed}
        styles={{ body: { padding: 0, background: isDarkMode ? "#141B2D" : '#F8FAFC'} }}

        style={{
            background: isDarkMode ? "#141B2D" : '#F8FAFC',
            borderRight: isDarkMode ? '1px solid #313747' : '1px solid #CBD5E140'
        }}
        width={280}
        size="default"
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
        background: isDarkMode ? "#141B2D" : '#F8FAFC',
        borderRight: isDarkMode ? '1px solid #313747' : '1px solid #CBD5E140',
        zIndex: 1001,
      }}
    >
      {menuContent}
    </Sider>
  );
};
