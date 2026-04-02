import React from 'react';
import { Layout } from 'antd';
import {useLayout} from "./LayoutContext.tsx";

const { Footer } = Layout;
export const AppFooter: React.FC = () => {
    const { isDarkMode } = useLayout();
  return (
    <Footer style={{ textAlign: 'center',  background: isDarkMode ? '#141B2D' : '#fff', }}>
      Prevent Mecânica ©{new Date().getFullYear()} <a type={'primary'}>Prevent Mecânica</a>
    </Footer>
  );
};
