import React from 'react';
import { Divider, Layout, Menu, Drawer, ConfigProvider, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  PieChartOutlined,
  BellOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  BuildOutlined,
  TransactionOutlined,
  WalletOutlined,
  GoogleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  TableOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { SidebarProfile } from './LayoutContext';

const { Sider } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

interface SidebarUxProfile {
  label: string;
  expandedWidth: number;
  collapsedWidth: number;
  drawerWidth: number;
  itemHeight: number;
  iconSize: number;
  itemFontSize: number;
  groupTitleFontSize: number;
  logoExpandedWidth: number;
  logoCollapsedWidth: number;
  itemPaddingInline: number;
}

const SIDEBAR_UX_PROFILES: Record<SidebarProfile, SidebarUxProfile> = {
  android: {
    label: 'Android',
    expandedWidth: 0,
    collapsedWidth: 0,
    drawerWidth: 300,
    itemHeight: 50,
    iconSize: 19,
    itemFontSize: 15,
    groupTitleFontSize: 12,
    logoExpandedWidth: 188,
    logoCollapsedWidth: 96,
    itemPaddingInline: 18,
  },
  ios: {
    label: 'iOS',
    expandedWidth: 0,
    collapsedWidth: 0,
    drawerWidth: 320,
    itemHeight: 52,
    iconSize: 20,
    itemFontSize: 15,
    groupTitleFontSize: 12,
    logoExpandedWidth: 192,
    logoCollapsedWidth: 96,
    itemPaddingInline: 18,
  },
  tablet: {
    label: 'Tablet',
    expandedWidth: 256,
    collapsedWidth: 88,
    drawerWidth: 0,
    itemHeight: 46,
    iconSize: 18,
    itemFontSize: 14,
    groupTitleFontSize: 12,
    logoExpandedWidth: 176,
    logoCollapsedWidth: 88,
    itemPaddingInline: 16,
  },
  tv: {
    label: 'TV',
    expandedWidth: 360,
    collapsedWidth: 128,
    drawerWidth: 0,
    itemHeight: 64,
    iconSize: 24,
    itemFontSize: 18,
    groupTitleFontSize: 14,
    logoExpandedWidth: 194,
    logoCollapsedWidth: 104,
    itemPaddingInline: 22,
  },
  corporate: {
    label: 'Corporativo',
    expandedWidth: 288,
    collapsedWidth: 92,
    drawerWidth: 0,
    itemHeight: 44,
    iconSize: 18,
    itemFontSize: 14,
    groupTitleFontSize: 12,
    logoExpandedWidth: 188,
    logoCollapsedWidth: 92,
    itemPaddingInline: 16,
  },
};

interface AppSiderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile?: boolean;
  isDarkMode: boolean;
  sidebarProfile: SidebarProfile;
}

export const AppSider: React.FC<AppSiderProps> = ({ collapsed, setCollapsed, isMobile, isDarkMode, sidebarProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarProfileConfig = SIDEBAR_UX_PROFILES[sidebarProfile];
  const effectiveCollapsed = sidebarProfile === 'tv' ? false : collapsed;

  const menuIconStyle = { fontSize: `${sidebarProfileConfig.iconSize}px` };

  const selectedMenuKey = React.useMemo(() => {
    const rootKeys = [
      '/processos',
      '/clcb',
      '/avcb',
      '/obras',
      '/lancamentos',
      '/custos-indiretos',
      '/gestao-de-clientes',
      '/gestao-ads',
      '/acompanhamento-servicos',
      '/notificacoes',
      '/cadastros',
      '/profile',
    ];

    const matched = rootKeys.find((key) => location.pathname.startsWith(key));
    if (matched) {
      return matched;
    }

    return location.pathname === '/' ? '/' : location.pathname;
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    {
      key: 'main-group',
      type: 'group',
      label: 'Principal',
      children: [
        {
          key: '/',
          icon: <PieChartOutlined style={menuIconStyle} />,
          label: 'Insights',
        },
        {
          key: '/notificacoes',
          icon: <BellOutlined style={menuIconStyle} />,
          label: 'Notificações',
        },
        {
          key: '/acompanhamento-servicos',
          icon: <TableOutlined style={menuIconStyle} />,
          label: 'Acompanhamento',
        },
        {
          key: '/cadastros',
          icon: <SolutionOutlined style={menuIconStyle} />,
          label: 'Cadastros',
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
          key: '/processos',
          icon: <AppstoreOutlined style={menuIconStyle} />,
          label: 'Processos Adm',
        },
        {
          key: '/clcb',
          icon: <SafetyCertificateOutlined style={menuIconStyle} />,
          label: 'Painel CLCB',
        },
        {
          key: '/avcb',
          icon: <FireOutlined style={menuIconStyle} />,
          label: 'Painel AVCB',
        },
        {
          key: '/obras',
          icon: <BuildOutlined style={menuIconStyle} />,
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
          icon: <TransactionOutlined style={menuIconStyle} />,
          label: 'Lançamentos',
        },
        {
          key: '/custos-indiretos',
          icon: <WalletOutlined style={menuIconStyle} />,
          label: 'Custos Indiretos',
        },
      ]

  },
      {
          type: 'divider',
      },
      {
          key: 'gestao-group',
          type: 'group',
          label: 'Gestões',
          children: [
              {
                  key: '/gestao-de-clientes',
                  icon: <TeamOutlined style={menuIconStyle} />,
                  label: 'Gestão de Clientes',
              },
              {
                  key: '/gestao-ads',
                  icon: <GoogleOutlined style={menuIconStyle} />,
                  label: 'Gestão Ads',
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

  const siderBackground = isDarkMode ? '#141B2D' : '#F8FAFC';
  const borderColor = isDarkMode ? '#313747' : '#CBD5E140';
  const menuScrollPaddingBottom = sidebarProfile === 'tv' ? 20 : 64;

  const menuContent = (
    <div
      className="atlas-sider-scroll-area"
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: menuScrollPaddingBottom,
      }}
    >

       <div
         style={{
           height: !effectiveCollapsed ? (sidebarProfile === 'tv' ? 126 : 96) : 72,
           margin: '8px 0 6px 0',
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'center',
           alignItems: 'center',
           padding: effectiveCollapsed ? '0.4rem' : '1rem',
           gap: '4px',
         }}
       >
         <img
           src={isDarkMode ? '/atlas-logo-white.svg' : '/atlas-logo-black.svg'}
           alt="Logo Atlas Engenharia"
           style={{
             width: !effectiveCollapsed ? sidebarProfileConfig.logoExpandedWidth : sidebarProfileConfig.logoCollapsedWidth,
             transition: 'width 0.2s ease',
           }}
         />
         {!effectiveCollapsed && sidebarProfile !== 'corporate' && (
           <Text
             style={{
               color: isDarkMode ? '#CBD5E1' : '#475569',
               fontSize: sidebarProfile === 'tv' ? 14 : 12,
               letterSpacing: '0.4px',
             }}
           >
             Layout {sidebarProfileConfig.label}
           </Text>
         )}
       </div>

       <ConfigProvider
            theme={{
                components: {
                        Menu: {
                                // Cor do titulo dos Grupos
                                groupTitleColor: isDarkMode ? '#FFFFFFD9' : '#1E293B',
                                groupTitleFontSize: sidebarProfileConfig.groupTitleFontSize,
                                // Cor dos itens
                                itemColor: isDarkMode ? '#FFFFFF' :'#1E293B' ,
                                itemSelectedColor:isDarkMode ? '#FFFFFF' : '#1E293B',
                                itemSelectedBg: isDarkMode ? '#FFFFFF0D' :'#1E1F2112',
                                itemHoverColor:isDarkMode ? '#FFFFFF' : '#1E293B',
                                itemHoverBg: isDarkMode ? '#FFFFFF14' : '#E2E8F099',
                                itemHeight: sidebarProfileConfig.itemHeight,
                                itemBorderRadius: sidebarProfile === 'tv' ? 14 : 10,
                                itemPaddingInline: sidebarProfileConfig.itemPaddingInline,
                                itemMarginBlock: sidebarProfile === 'tv' ? 8 : 4,
                                itemMarginInline: sidebarProfile === 'tv' ? 10 : 6,
                                activeBarHeight: 2,
                                collapsedIconSize: sidebarProfileConfig.iconSize,
                            }
                    }
                }}
       >
      <Menu
        mode="inline"
        selectedKeys={[selectedMenuKey]}
        items={menuItems}
        style={{background: siderBackground,
            borderRight:'none',
            paddingInline: sidebarProfile === 'tv' ? 8 : 4,
            fontSize: sidebarProfileConfig.itemFontSize,
        }}

        onClick={handleMenuClick}
      />

       </ConfigProvider>

      <Divider style={{ margin: '5px 0' }} />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={() => setCollapsed(true)}
        open={!collapsed}
        styles={{
          body: {
            padding: 0,
            background: siderBackground,
            borderTopRightRadius: sidebarProfile === 'ios' ? 24 : 16,
            borderBottomRightRadius: sidebarProfile === 'ios' ? 24 : 16,
            overflow: 'hidden',
          }
        }}

        style={{
            background: siderBackground,
            borderRight: `1px solid ${borderColor}`,
        }}
        size={sidebarProfileConfig.drawerWidth}
      >
        {menuContent}
      </Drawer>
    );
  }

  return (
    <Sider
      className="atlas-app-sider"
      collapsible={sidebarProfile !== 'tv'}
      collapsed={effectiveCollapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={sidebarProfileConfig.expandedWidth}
      collapsedWidth={sidebarProfileConfig.collapsedWidth}
      trigger={sidebarProfile === 'tv' ? null : (
        <div
          style={{
            color: isDarkMode ? '#E2E8F0' : '#334155',
            borderRadius: '10px',
            margin: '0 10px 10px',
            border: `1px solid ${isDarkMode ? '#2A3A5C' : '#E2E8F0'}`,
            height: sidebarProfile === 'corporate' ? 34 : 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: siderBackground,
          }}
        >
          {effectiveCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      )}
      style={{
        overflow: 'hidden',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: siderBackground,
        borderRight: `1px solid ${borderColor}`,
        zIndex: 1001,
      }}
    >
      {menuContent}
    </Sider>
  );
};
