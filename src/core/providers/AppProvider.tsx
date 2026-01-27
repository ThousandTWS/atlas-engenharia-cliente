import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { themeConfig } from '../config/theme';
import ptBR from 'antd/locale/pt_BR';
import { router } from '../routes/router';

interface AppProviderProps {
  children?: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = () => {
  return (
    <ConfigProvider locale={ptBR} theme={themeConfig}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
};
