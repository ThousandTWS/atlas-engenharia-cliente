/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Breadcrumb,
  App,
} from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CLCBTable } from '../components/CLCBTable';
import type { CLCB } from '../components/CLCBTable';
import { CLCBFilters } from '../components/CLCBFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { clcbService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const CLCBPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode } = useLayout();
  const [clcbs, setClcbs] = useState<CLCB[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCLCBs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clcbService.getAll() as any;
      if (data && data.content) {
        setClcbs(data.content);
      } else {
        setClcbs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar CLCBs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCLCBs();
  }, [fetchCLCBs]);

  const handleDelete = async (id: number) => {
    try {
      await clcbService.delete(id);
      message.success('CLCB excluído com sucesso');
      fetchCLCBs();
    } catch (error: any) {
      message.error('Erro ao excluir CLCB: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/clcb/novo');
  };

  const handleEdit = (record: CLCB) => {
    navigate(`/clcb/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel CLCB' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <Space orientation="vertical" size={0}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Painel CLCB
          </Title>
          <Text type="secondary">Gerencie Certificados de Licença do Corpo de Bombeiros.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo CLCB
        </Button>
      </div>

      <CLCBFilters
        onSearch={(values) => console.log('Filtrar:', values)}
        onClear={() => console.log('Limpar filtros')}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Situação dos CLCBs"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              clcbs.reduce((acc: Record<string, number>, curr) => {
                acc[curr.situacao] = (acc[curr.situacao] || 0) + 1;
                return acc;
              }, {}),
            ).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
              color: label === 'CONCLUIDO'
                ? '#52c41a'
                : label === 'EM_ANDAMENTO'
                  ? '#1890ff'
                  : label === 'PENDENTE'
                    ? '#faad14'
                    : '#ff4d4f',
            }))}
          />
        </Col>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Volume Financeiro por Status"
            subtitle="Total em contrato por situação (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              clcbs.reduce((acc: Record<string, number>, curr) => {
                acc[curr.situacao] = (acc[curr.situacao] || 0) + (curr.valorContrato || 0);
                return acc;
              }, {}),
            ).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
              color: label === 'CONCLUIDO'
                ? '#52c41a'
                : label === 'EM_ANDAMENTO'
                  ? (isDarkMode ? '#8B5E47' : '#1890ff')
                  : label === 'PENDENTE'
                    ? '#faad14'
                    : '#ff4d4f',
            }))}
          />
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <CLCBTable
          dataSource={clcbs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar CLCB: ${record.codigo}`)}
        />
      </Card>
    </div>
  );
};
