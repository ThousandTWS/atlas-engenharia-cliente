import React from 'react';
import { Card, Image } from 'antd';
import { useLayout } from '../../../shared/components/layout/LayoutContext.tsx';

export const WelcomeBanner: React.FC = () => {
  const { isDarkMode } = useLayout();

  return (
    <Card
      className="prevent-dashboard-brand-banner"
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
      <div className="prevent-dashboard-brand-glow prevent-dashboard-brand-glow-left" />
      <div className="prevent-dashboard-brand-glow prevent-dashboard-brand-glow-right" />

      <div className="prevent-dashboard-brand-banner-inner">
        <Image
          preview={false}
          src={isDarkMode ? '/White_Prevent_Logo.svg' : '/White_Prevent_Logo.svg'}
          alt="Prevent Mecânica"
          className="prevent-dashboard-brand-logo"
        />
      </div>
    </Card>
  );
};
