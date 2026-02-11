import { Layout, ConfigProvider, theme } from 'antd';
import { Outlet  } from 'react-router-dom';
import { LayoutProvider, useLayout } from './shared/components/layout/LayoutContext';
import '../index.css'

import { AppSider } from './shared/components/layout/AppSider';
import { AppHeader } from './shared/components/layout/AppHeader';
import { AppFooter } from './shared/components/layout/AppFooter';
import './shared/components/layout/theme/token.json';
const { Content } = Layout;

function AppLayoutStructure() {
  const {collapsed,setCollapsed,isMobile,sideBarWidth, isDarkMode, toggleTheme} = useLayout();


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
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        <Content
        style={{
          margin: isMobile ? '72px 8px 16px' : '88px 16px 24px',
          padding: isMobile ? 12 : 24,
          minHeight: 280,
            color: isDarkMode ? '#fff' : '#1E293B',
          background: isDarkMode ? 'linear-gradient(145deg, #141B2D 0%, #0A0F1C 100%)' : '#FCFCFC' ,
          borderRadius: '8px',
          overflow: 'initial'

        }}>
          <Outlet />
        </Content>

        <AppFooter />
      </Layout>
    </Layout>
   </ConfigProvider>
  )
}

function App() {
        return (
            <LayoutProvider>
                <AppLayoutStructure />
            </LayoutProvider>
            );
    }

export default App
