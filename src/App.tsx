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
            components: {
                Modal: {
                    // Altera o fundo do corpo do modal
                    contentBg: isDarkMode ? '#141B2D' : '#ffffff',

                    // Altera o fundo do título/topo
                    headerBg: isDarkMode ? '#141B2D' : '#ffffff',

                    // Cor do texto do título
                    titleColor: isDarkMode ? '#ffffff' : '#000000',

                    // Cor do ícone de fechar (X)
                },
                    Table: {
                        headerBg: isDarkMode ? '#1c2536' : '#FFFFFF',
                        headerColor: isDarkMode ? '#FFFFFF' : '#1E293B',

                        colorBgContainer: isDarkMode ? '#0A0F1C' : '#FAFBFC',
                        colorText: isDarkMode ? '#E2E8F0' : '#334155',

                        rowHoverBg: isDarkMode ? '#1e293b' : '#F8FAFC',},

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
          background: isDarkMode ? '#0A0F1C' : '#FFFFFF'
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
          background: isDarkMode ? 'linear-gradient(145deg, #141B2D 0%, #0A0F1C 100%)' : '#F5F7FA' ,
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
