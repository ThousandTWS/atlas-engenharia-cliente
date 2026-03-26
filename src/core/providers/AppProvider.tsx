import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ConfigProvider, App as AntdApp, Alert } from 'antd';
import { RouterProvider } from 'react-router-dom';
import ptBR from 'antd/locale/pt_BR';
import { router } from '../routes/router';
import { NotificationCenterProvider } from '../notifications/NotificationCenterContext';
import { LayoutProvider } from '../../shared/components/layout/LayoutContext';
import useBootstrapTheme from '../../shared/theme/bootstrapTheme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

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
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Alert
            message="Ocorreu um erro inesperado"
            description={this.state.error?.message || "Por favor, tente recarregar a página."}
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}

interface AppProviderProps {
  children?: React.ReactNode;
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
