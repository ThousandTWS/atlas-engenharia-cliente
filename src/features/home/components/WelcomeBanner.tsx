import React from 'react';
import { Card } from 'antd';
import {useLayout} from '../../../shared/components/layout/LayoutContext.tsx'

export const WelcomeBanner: React.FC = () => {

    const {isDarkMode} = useLayout();
  return (
    <Card
      variant="borderless"
      style={{
        background: isDarkMode ? 'linear-gradient(135deg, #2A3A5C 0%, #1E2A47 50%, #141B2D 100%)' : '#FFF',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isDarkMode ?  '0 10px 24px #0000001A' : '0 10px 24px #3B82F61A',
        width: '100%',
        display: 'flex',
          justifyContent: 'center',
        alignItems: 'center',
        padding: '12px'
      }}
    >
      <div  style={{ position: 'relative', zIndex: 1}}>
      </div>

    </Card>

  );
};
