import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

export const AppFooter: React.FC = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      Atlas Engenharia ©{new Date().getFullYear()} Developed by <a href="https://www.thousandtws.com/" target="_blank">TWS Thousand TWS</a>
    </Footer>
  );
};
