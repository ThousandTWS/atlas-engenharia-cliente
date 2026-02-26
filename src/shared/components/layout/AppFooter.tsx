import React from 'react';
import { Layout } from 'antd';
import {useLayout} from "./LayoutContext.tsx";

const { Footer } = Layout;
export const AppFooter: React.FC = () => {
    const { isDarkMode } = useLayout();
  return (
    <Footer style={{ textAlign: 'center',  background: isDarkMode ? '#141B2D' : '#fff', }}>
      Atlas Engenharia ©{new Date().getFullYear()} Developed by <a type={'primary'}>Atlas Engenharia Version 1.1.0</a>
    </Footer>
  );
};
