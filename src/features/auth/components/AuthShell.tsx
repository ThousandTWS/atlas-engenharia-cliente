import React from 'react';
import { Button, Card, Grid, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface AuthShellProps {
  contextLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  contextLabel,
  title,
  subtitle,
  children,
  footer,
  backTo,
  backLabel = 'Voltar',
}) => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const isMobile = !screens.md;

  return (
    <div className="prevent-auth-shell">
      <div className="prevent-auth-shell-glow" />
      <div className="prevent-auth-shell-grid">
        <section className="prevent-auth-brand-panel" aria-hidden={isMobile}>
          <div className="prevent-auth-brand-top">
            <img src="/White_Prevent_Logo.svg" alt="Prevent Mecânica" className="prevent-auth-brand-logo" />
          </div>
          <div className="prevent-auth-brand-visual">
            <img
              src="/auth-placeholder-image.png"
              alt="Placeholder visual da plataforma"
              className="prevent-auth-brand-illustration"
            />
          </div>
        </section>

        <section className="prevent-auth-form-panel">
          <Card
            className="prevent-auth-card"
            styles={{
              body: {
                padding: isMobile ? 22 : 30,
              },
            }}
          >
            {backTo && (
              <Button
                className="prevent-auth-back-button"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(backTo)}
              >
                {backLabel}
              </Button>
            )}

            <Text className="prevent-auth-context">{contextLabel}</Text>
            <Title level={2} className="prevent-auth-title">
              {title}
            </Title>
            <Text className="prevent-auth-subtitle">{subtitle}</Text>

            <div className="prevent-auth-form-content">{children}</div>

            {footer && <div className="prevent-auth-footer">{footer}</div>}
          </Card>
        </section>
      </div>
    </div>
  );
};
