/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Space, App } from 'antd';
import {
  SyncOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DollarOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { resolveProjectPhase } from '../utils/projectStatusStrategies';
import { homeDashboardFacade } from '../services/homeDashboardFacade';
import { CollectionComposite, CollectionLeaf } from '../../../core/structural/composite/collectionComposite';
import { formatCurrencyPtBr } from '../../../core/structural/flyweight/numberFormatterFlyweight';

const { Text, Title } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor,
  loading 
}) => {
  return (
    <Card 
      variant="borderless" 
      loading={loading}
      styles={{ body: { padding: '20px' } }}
      style={{ 
        borderRadius: '16px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: '100%',
        border: '1px solid #f0f0f0',
        transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = `${iconColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = '#f0f0f0';
      }}
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ 
            color: iconColor, 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${iconColor}12`,
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 10px ${iconColor}15`
          }}>
            {icon}
          </div>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            {title}
          </Text>
          <Title level={3} style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1f1f1f' }}>
            {value}
          </Title>
        </div>
      </Space>
    </Card>
  );
};

export const DashboardStats: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    propostas: 0,
    emAnálise: 0,
    aprovadas: 0,
    reprovadas: 0,
    volumePropostas: 0,
    volumeEmAnálise: 0,
    volumeAprovadas: 0,
    volumeReprovadas: 0,
    custosIndiretos: 0,
    lucroTotal: 0,
  });

  const formatCurrency = (value: number) => {
    return formatCurrencyPtBr(value, 2);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const snapshot = await homeDashboardFacade.getSnapshot(0, 500);

        const projectsComposite = new CollectionComposite<any>();
        projectsComposite.add(new CollectionLeaf(snapshot.avcbs));
        projectsComposite.add(new CollectionLeaf(snapshot.clcbs));
        projectsComposite.add(new CollectionLeaf(snapshot.obras));
        projectsComposite.add(new CollectionLeaf(snapshot.processos));

        const allProjects: any[] = projectsComposite.toArray();
        const allCustos: any[] = snapshot.custos;
        const allLancamentos: any[] = snapshot.lancamentos;

        const totalCustosIndiretos = allCustos.reduce((acc, curr) => acc + (curr.valor || 0), 0);
        const totalLucro = allLancamentos.reduce((acc, curr) => acc + (curr.lucro || 0), 0);

        const stats = allProjects.reduce((acc, item) => {
          const situacao = item.situacao || item.status;
          const valor = item.valorContrato || 0;
          const phase = resolveProjectPhase(situacao);

          acc.total++;
          acc.totalVolume += valor;

          if (phase === 'analysis') {
            acc.emAnálise++;
            acc.volumeEmAnálise += valor;
          } else if (phase === 'approved') {
            acc.aprovadas++;
            acc.volumeAprovadas += valor;
          } else if (phase === 'rejected') {
            acc.reprovadas++;
            acc.volumeReprovadas += valor;
          }

          return acc;
        }, {
          total: 0,
          emAnálise: 0,
          aprovadas: 0,
          reprovadas: 0,
          totalVolume: 0,
          volumeEmAnálise: 0,
          volumeAprovadas: 0,
          volumeReprovadas: 0
        });

        setData({
          propostas: stats.total,
          emAnálise: stats.emAnálise,
          aprovadas: stats.aprovadas,
          reprovadas: stats.reprovadas,
          volumePropostas: stats.totalVolume,
          volumeEmAnálise: stats.volumeEmAnálise,
          volumeAprovadas: stats.volumeAprovadas,
          volumeReprovadas: stats.volumeReprovadas,
          custosIndiretos: totalCustosIndiretos,
          lucroTotal: totalLucro,
        });
      } catch (error: any) {
        message.error('Erro ao carregar estatísticas: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [message]);

  const stats = [
    {
      title: 'Propostas',
      value: data.propostas,
      icon: <SyncOutlined />,
      iconColor: '#1890ff',
      loading
    },
    {
      title: 'Em Análise',
      value: data.emAnálise,
      icon: <ClockCircleOutlined />,
      iconColor: '#faad14',
      loading
    },
    {
      title: 'Aprovadas',
      value: data.aprovadas,
      icon: <CheckCircleOutlined />,
      iconColor: '#52c41a',
      loading
    },
    {
      title: 'Reprovadas',
      value: data.reprovadas,
      icon: <CloseCircleOutlined />,
      iconColor: '#ff4d4f',
      loading
    },
    {
      title: 'Custos Indiretos',
      value: formatCurrency(data.custosIndiretos),
      icon: <DollarOutlined />,
      iconColor: '#722ed1',
      loading
    },
    {
      title: 'Lucro Global',
      value: formatCurrency(data.lucroTotal),
      icon: <LineChartOutlined />,
      iconColor: '#eb2f96',
      loading
    }
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '8px' }}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} md={8} lg={4} key={index}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  );
};
