import React from 'react';
import { Breadcrumb, Col, Row, Space, Tag, Typography } from 'antd';
import { GoogleOutlined, HomeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { AdsPerformanceChart } from '../components/AdsPerformanceChart';
import { CampaignPerformanceTable } from '../components/CampaignPerformanceTable';
import { GeminiInsights } from '../components/GeminiInsights';

const { Title } = Typography;

export const GestaoAdsPage: React.FC = () => {
  return (
    <div style={{ padding: '4px' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestões' },
          { title: 'Gestão Ads' },
        ]}
        style={{ marginBottom: 12 }}
      />

      <Space direction="vertical" size={4} style={{ marginBottom: 20 }}>
        <Space align="center">
          <Tag icon={<GoogleOutlined />} color="blue" style={{ borderRadius: 8 }}>
            Google Ads-like
          </Tag>
          <Tag icon={<ThunderboltOutlined />} color="gold" style={{ borderRadius: 8 }}>
            ROI em tempo real
          </Tag>
        </Space>
        <Title level={2} style={{ margin: 0 }}>Dashboard Interativo de Tráfego Pago</Title>
       
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <AdsPerformanceChart />
        </Col>
        <Col xs={24} xl={8}>
          <GeminiInsights />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 12 }}>
        <Col span={24}>
          <CampaignPerformanceTable />
        </Col>
      </Row>
    </div>
  );
};
