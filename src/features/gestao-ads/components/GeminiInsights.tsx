import React, { useCallback, useEffect, useState } from 'react';
import { App, Button, Card, List, Space, Tag, Typography } from 'antd';
import { BulbOutlined, ReloadOutlined, RobotOutlined } from '@ant-design/icons';
import { fetchCampaignPerformance, fetchPerformanceTimeseries } from '../services/adsDataService';
import { fetchGeminiInsights } from '../services/adsInsightsService';
import type { GeminiInsight } from '../services/adsInsightsService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const GeminiInsights: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const [insights, setInsights] = useState<GeminiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const [campaigns, performance] = await Promise.all([
        fetchCampaignPerformance(),
        fetchPerformanceTimeseries('30d'),
      ]);

      const result = await fetchGeminiInsights({ campaigns, performance });
      setInsights(result);
    } catch (err) {
      console.error('Erro ao gerar insights Gemini', err);
      message.error('Não foi possível gerar insights agora.');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <Card
      title={
        <Space align="center">
          <RobotOutlined style={{ color: '#4285F4' }} />
          <div>
            <Text style={{ color: isDarkMode ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Gemini Ads</Text>
            <Title level={4} style={{ margin: 0 }}>Insights acionáveis</Title>
          </div>
        </Space>
      }
      extra={
        <Button className="ads-refresh-button" icon={<ReloadOutlined />} onClick={loadInsights} loading={loading}>
          Atualizar
        </Button>
      }
      style={{
        borderRadius: 16,
        height: '100%',
        boxShadow: isDarkMode ? '0 12px 30px #00000026' : '0 12px 30px #0F172A12',
        background: isDarkMode ? 'linear-gradient(145deg, #0A0F1C 0%, #0F172A 100%)' : '#fff',
      }}
      styles={{ body: { padding: 20 } }}
      loading={loading}
    >
      <List
        itemLayout="vertical"
        dataSource={insights}
        renderItem={(item) => (
          <List.Item key={item.id} style={{ borderBlockEnd: '1px solid #E5E7EB1A', padding: '12px 0' }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space>
                <BulbOutlined style={{ color: '#F9AB00' }} />
                <Text strong>{item.titulo}</Text>
              </Space>
              <Text style={{ color: isDarkMode ? '#E2E8F0' : '#111827' }}>{item.recomendacao}</Text>
              <Space wrap size={6}>
                <Tag color={item.impacto === 'ROI' ? 'green' : item.impacto === 'Lances' ? 'blue' : item.impacto === 'Orçamento' ? 'gold' : 'purple'}>
                  {item.impacto}
                </Tag>
                <Tag color={item.prioridade === 'alta' ? 'red' : item.prioridade === 'media' ? 'orange' : 'default'}>
                  Prioridade {item.prioridade}
                </Tag>
              </Space>
            </Space>
          </List.Item>
        )}
      />
      {insights.length === 0 && !loading && (
        <Text type="secondary">Nenhuma recomendação disponível no momento.</Text>
      )}
    </Card>
  );
};
