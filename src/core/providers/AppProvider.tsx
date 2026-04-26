import React, { Component, type ErrorInfo } from 'react';
import { ConfigProvider, App as AntdApp, Alert } from 'antd';
import { RouterProvider } from 'react-router-dom';
import ptBR from 'antd/locale/pt_BR';
import { router } from '../routes/router';
import { NotificationCenterProvider } from '../services/notifications/NotificationCenterContext';
import { LayoutProvider } from '../../shared/components/layout/LayoutContext';
import useBootstrapTheme from '../../shared/theme/bootstrapTheme';
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
  const configProps = useBootstrapTheme();

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
