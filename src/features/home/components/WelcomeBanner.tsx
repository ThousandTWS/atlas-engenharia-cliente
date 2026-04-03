import React from 'react';
import { Card, Image } from 'antd';
import { useLayout } from '../../../shared/components/layout/LayoutContext.tsx';

export const WelcomeBanner: React.FC = () => {
  const { isDarkMode } = useLayout();

  return (
    <Card
      className="atlas-dashboard-brand-banner"
      variant="borderless"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #0d1b31 0%, #102746 55%, #153760 100%)'
          : 'linear-gradient(135deg, #0f2743 0%, #173a63 55%, #28558b 100%)',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isDarkMode ? '0 24px 60px #02061755' : '0 24px 60px #0f172a14',
        width: '100%',
        border: isDarkMode ? '1px solid #28446d' : '1px solid #295487',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div className="atlas-dashboard-brand-glow atlas-dashboard-brand-glow-left" />
      <div className="atlas-dashboard-brand-glow atlas-dashboard-brand-glow-right" />

      <div className="atlas-dashboard-brand-banner-inner">
        <Image
          preview={false}
          src={isDarkMode ? '/atlas-logo-white.svg' : '/atlas-logo-black.svg'}
          alt="Atlas Engenharia"
          className="atlas-dashboard-brand-logo"
        />
      </div>
    </Card>
  );
};
