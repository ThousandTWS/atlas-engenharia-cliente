import React, { Component, type ErrorInfo } from 'react';
import { ConfigProvider, App as AntdApp, Alert, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import ptBR from 'antd/locale/pt_BR';
import { router } from '../routes/router';
import { NotificationCenterProvider } from '../services/notifications/NotificationCenterContext';
import { LayoutProvider, useLayout } from '../../shared/components/layout/LayoutContext';
import type { ErrorBoundaryProps } from 'antd/lib';
import type { AppProviderProps, ErrorBoundaryState } from './types';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const showStack = import.meta.env.DEV && Boolean(this.state.error?.stack);
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Alert
            message="Ocorreu um erro inesperado"
            description={(
              <div>
                <div>{this.state.error?.message || "Por favor, tente recarregar a página."}</div>
                {showStack && (
                  <pre style={{ marginTop: 12, textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                    {this.state.error?.stack}
                  </pre>
                )}
              </div>
            )}
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const ThemedRouter: React.FC = () => {
  const { isDarkMode } = useLayout();
  const configProps = {
    theme: {
      algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#A67458',
        colorPrimaryHover: '#B48368',
        colorPrimaryActive: '#8B5E47',
        borderRadius: 6,
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        colorBgLayout: isDarkMode ? '#0A0F1C' : '#F7F8FA',
        colorBgContainer: isDarkMode ? '#141B2D' : '#ffffff',
        colorBorder: isDarkMode ? '#2A3A5C' : '#d9d9d9',
        colorText: isDarkMode ? '#E2E8F0' : 'rgba(0, 0, 0, 0.88)',
      },
      components: {
        Button: {
          colorPrimary: '#A67458',
          colorPrimaryHover: '#B48368',
          colorPrimaryActive: '#8B5E47',
          algorithm: true,
        },
        Modal: {
          contentBg: isDarkMode ? '#141B2D' : '#ffffff',
          headerBg: isDarkMode ? '#141B2D' : '#ffffff',
          titleColor: isDarkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.88)',
        },
        Table: {
          headerBg: isDarkMode ? '#1C2536' : '#fafafa',
          headerColor: isDarkMode ? '#FFFFFF' : 'rgba(0, 0, 0, 0.88)',
          colorBgContainer: isDarkMode ? '#0A0F1C' : '#ffffff',
          colorText: isDarkMode ? '#E2E8F0' : 'rgba(0, 0, 0, 0.88)',
          rowHoverBg: isDarkMode ? '#1E293B' : '#fafafa',
        },
        Select: {
          selectorBg: isDarkMode ? '#171C2A' : '#ffffff',
          optionSelectedBg: isDarkMode ? '#1E293B' : '#e6f4ff',
          colorBgElevated: isDarkMode ? '#171C2A' : '#ffffff',
          colorBorder: isDarkMode ? '#2A3A5C' : '#d9d9d9',
        },
      },
    },
  };

  return (
    <ConfigProvider locale={ptBR} {...configProps}>
      <AntdApp>
        <NotificationCenterProvider>
          <RouterProvider router={router} />
        </NotificationCenterProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export const AppProvider: React.FC<AppProviderProps> = () => {
  return (
    <ErrorBoundary>
      <LayoutProvider>
        <ThemedRouter />
      </LayoutProvider>
    </ErrorBoundary>
  );
};
