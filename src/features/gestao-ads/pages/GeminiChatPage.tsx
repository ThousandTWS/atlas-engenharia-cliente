import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { GeminiChatCard } from '../components/GeminiChatCard';

export const GeminiChatPage: React.FC = () => {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestões' },
          { title: 'Gestão Ads', href: '/gestao-ads' },
          { title: 'Chat IA' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <GeminiChatCard />
    </div>
  );
};
