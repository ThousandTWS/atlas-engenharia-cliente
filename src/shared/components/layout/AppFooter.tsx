import React from 'react';
import { Layout } from 'antd';
import {useLayout} from "./LayoutContext.tsx";

const { Footer } = Layout;
export const AppFooter: React.FC = () => {
    const { isDarkMode } = useLayout();
  return (
    <Footer style={{ textAlign: 'center',  background: isDarkMode ? '#141B2D' : '#fff', }}>
      Atlas Engenharia ©{new Date().getFullYear()} Developed by <a href="https://www.thousandtws.com/" target="_blank"  type={'primary'}>TWS Thousand TWS</a>
    </Footer>
  );
};
