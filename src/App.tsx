import { Layout, ConfigProvider, theme } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutProvider, useLayout } from './shared/components/layout/LayoutContext';
import '../index.css'

import { AppSider } from './shared/components/layout/AppSider';
import { AppHeader } from './shared/components/layout/AppHeader';
import { AppFooter } from './shared/components/layout/AppFooter';
import { GlobalAiDrawerProvider } from './features/ai/context/GlobalAiDrawerContext';
import { GlobalAiAssistantDrawer } from './features/ai/components/GlobalAiAssistantDrawer';
import './shared/components/layout/theme/token.json';
const { Content } = Layout;

function AppLayoutStructure() {
  const {collapsed, setCollapsed, isMobile, sidebarProfile, sideBarWidth, isDarkMode, toggleTheme} = useLayout();
  const location = useLocation();
  const isProfilePage = location.pathname.startsWith('/profile');
  const contentMargin = isProfilePage
    ? (isMobile ? '72px 0 16px' : '88px 0 24px')
    : (isMobile ? '72px 8px 16px' : '88px 16px 24px');
  const contentPadding = isProfilePage ? 0 : (isMobile ? 12 : 24);
  const contentBorderRadius = isProfilePage ? '0' : '8px';


  return (
      <ConfigProvider

        theme={{
            algorithm : isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {colorPrimary: isDarkMode ? '#A67458' : '#1890ff' },
            components: {

                Modal: {
                    contentBg: isDarkMode ? '#141B2D' : '#ffffff',
                    headerBg: isDarkMode ? '#141B2D' : '#ffffff',
                    titleColor: isDarkMode ? '#ffffff' : '#000000',

                },
                Table: {
                    headerBg: isDarkMode ? '#1c2536' : '#FFFFFF',
                    headerColor: isDarkMode ? '#FFFFFF' : '#1E293B',
                    colorBgContainer: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                    colorText: isDarkMode ? '#E2E8F0' : '#334155',
                    rowHoverBg: isDarkMode ? '#1e293b' : '#F8FAFC',
                },
                Button: {
                    colorPrimary: isDarkMode ? '#A67458' : '#1890ff',
                },
                Select: {
                    selectorBg: isDarkMode ? '#171C2A' : '#ffffff',

                    optionSelectedBg: isDarkMode ? '#1e293b' : '#e6f4ff',
                    colorBgElevated: isDarkMode ? '#171C2A' : '#ffffff',

                    colorBorder: isDarkMode ? '#1E2A47' : '#CBD5E1',
                },
            },


            }}
      >
    <Layout style={{ minHeight: '100vh'}}>
      <AppSider
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        isDarkMode={isDarkMode}
        sidebarProfile={sidebarProfile}
      />
      <Layout style={{
        marginLeft:sideBarWidth,
        transition: 'all 0.2s',
        minWidth: 0,
          background: isDarkMode ? '#0A0F1C' : '#1E1F2112'
      }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobile={isMobile}
          sideBarWidth={sideBarWidth}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        <Content
        style={{
          margin: contentMargin,
          padding: contentPadding,
          minHeight: 280,
            color: isDarkMode ? '#fff' : '#1E293B',
          background: isDarkMode ? 'linear-gradient(145deg, #141B2D 0%, #0A0F1C 100%)' : '#FCFCFC' ,
          borderRadius: contentBorderRadius,
          overflow: 'initial'

        }}>
          <Outlet />
        </Content>

        <AppFooter />
      </Layout>
    </Layout>
    <GlobalAiAssistantDrawer />
   </ConfigProvider>
  )
}

function App() {
        return (
            <LayoutProvider>
              <GlobalAiDrawerProvider>
                <AppLayoutStructure />
              </GlobalAiDrawerProvider>
            </LayoutProvider>
            );
    }

export default App
