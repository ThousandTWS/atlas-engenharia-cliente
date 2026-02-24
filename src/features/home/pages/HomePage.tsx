import { Breadcrumb, Row, Col } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { DashboardAreaCards } from '../components/DashboardAreaCards';
import { DashboardTableAntd } from '../components/DashboardTableAntd';
import { WelcomeBanner } from '../components/WelcomeBanner';


export const HomePage = () => {
  return (
    <div style={{ padding: '4px'}}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Dashboard' },
          { title: 'Insights' },
        ]}
        style={{ marginBottom: 16 }}
      />
      
      <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
          <Col span={24}>
              <WelcomeBanner />
          </Col>
      </Row>
      
      <div style={{ marginTop: '24px' }}>
        <DashboardAreaCards />
      </div>

      <DashboardTableAntd />
      
      {/* Espaço para futuras seções do dashboard */}
      <div style={{ marginTop: 32 }}>
        {/* Gráficos, Tabelas de Atividade Recente, etc */}
      </div>
    </div>
  );
};
