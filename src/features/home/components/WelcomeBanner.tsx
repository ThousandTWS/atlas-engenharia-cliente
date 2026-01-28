import React from 'react';
import { Card, Typography, Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const WelcomeBanner: React.FC = () => {
  return (
    <Card
      variant="borderless"
      style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(24, 144, 255, 0.25)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '12px'
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, paddingLeft: '32px', paddingRight: '32px' }}>
        <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: '8px' }}>
          Bem-vindo ao Atlas! <RocketOutlined />
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '16px', display: 'block', marginBottom: '20px' }}>
          Explore seus indicadores e gerencie suas obras com eficiência.
        </Text>
        <Button 
          type="default" 
          ghost 
          size="large"
          style={{ 
            borderRadius: '8px', 
            borderColor: '#fff', 
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            padding: '0 24px'
          }}
        >
          Ver Documentação
        </Button>
      </div>

      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '120px',
        height: '120px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        right: '20px',
        width: '80px',
        height: '80px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        zIndex: 0
      }} />
    </Card>
  );
};
