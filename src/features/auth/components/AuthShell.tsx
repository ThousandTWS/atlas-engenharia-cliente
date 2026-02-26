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
    <div className="atlas-auth-shell">
      <div className="atlas-auth-shell-glow" />
      <div className="atlas-auth-shell-grid">
        <section className="atlas-auth-brand-panel" aria-hidden={isMobile}>
          <div className="atlas-auth-brand-top">
            <img src="/White_Atlas_Logo.svg" alt="Atlas Engenharia" className="atlas-auth-brand-logo" />
          </div>
          <div className="atlas-auth-brand-visual">
            <img
              src="/auth-placeholder-image.png"
              alt="Placeholder visual da plataforma"
              className="atlas-auth-brand-illustration"
            />
          </div>
        </section>

        <section className="atlas-auth-form-panel">
          <Card
            className="atlas-auth-card"
            styles={{
              body: {
                padding: isMobile ? 22 : 30,
              },
            }}
          >
            {backTo && (
              <Button
                className="atlas-auth-back-button"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(backTo)}
              >
                {backLabel}
              </Button>
            )}

            <Text className="atlas-auth-context">{contextLabel}</Text>
            <Title level={2} className="atlas-auth-title">
              {title}
            </Title>
            <Text className="atlas-auth-subtitle">{subtitle}</Text>

            <div className="atlas-auth-form-content">{children}</div>

            {footer && <div className="atlas-auth-footer">{footer}</div>}
          </Card>
        </section>
      </div>
    </div>
  );
};
