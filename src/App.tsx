import { useState, useEffect } from 'react';
import { Layout, Grid } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSider } from './shared/components/layout/AppSider';
import { AppHeader } from './shared/components/layout/AppHeader';
import { AppFooter } from './shared/components/layout/AppFooter';

const { Content } = Layout;
const { useBreakpoint } = Grid;

function App() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [location.pathname, isMobile]);


  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const marginLeft = isMobile ? 0 : (collapsed ? 80 : 200);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSider 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isMobile={isMobile} 
      />
      <Layout style={{ 
        marginLeft, 
        transition: 'all 0.2s',
        minWidth: 0 
      }}>
        <AppHeader 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          isMobile={isMobile} 
        />
        <Content style={{ 
          margin: isMobile ? '72px 8px 16px' : '88px 16px 24px', 
          padding: isMobile ? 12 : 24, 
          minHeight: 280, 
          background: '#fff', 
          borderRadius: '8px',
          overflow: 'initial' 
        }}>
          <Outlet />
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  )
}

export default App
