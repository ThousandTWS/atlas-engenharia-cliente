import { Breadcrumb, Col, Row, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, HomeOutlined } from '@ant-design/icons';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard';
import { WelcomeBanner } from '../components/WelcomeBanner';
import dayjs from 'dayjs';

const { Title, Text } = Typography;


export const HomePage = () => {
  return (
    <div className="atlas-dashboard-page">
      <div className="atlas-dashboard-shell">
        <div className="atlas-dashboard-topbar">
          <div>
            <Breadcrumb
              items={[
                { title: <HomeOutlined />, href: '/' },
                { title: 'Dashboard' },
                { title: 'Insights' },
              ]}
              style={{ marginBottom: 12 }}
            />

            <Space direction="vertical" size={4}>
              <Title level={2} style={{ margin: 0 }}>
                Central de performance
              </Title>
              <Text type="secondary">
                Visão executiva com indicadores, evolução operacional e movimentações recentes.
              </Text>
            </Space>
          </div>

          <div className="atlas-dashboard-topbar-meta">
            <Tag className="atlas-dashboard-meta-chip" bordered={false}>
              <CalendarOutlined /> {dayjs().format('DD/MM/YYYY')}
            </Tag>
          </div>
        </div>

        <Row gutter={[20, 20]} align="middle" style={{ marginBottom: 12 }}>
          <Col span={24}>
            <WelcomeBanner />
          </Col>
        </Row>

        <section className="atlas-dashboard-section" id="atlas-dashboard-charts">
          <ExecutiveDashboard />
        </section>
      </div>
    </div>
  );
};
