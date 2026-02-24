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
import { AVCBTable } from '../components/AVCBTable';
import type { AVCB } from '../components/AVCBTable';
import { AVCBFilters } from '../components/AVCBFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { avcbService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const AVCBPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode } = useLayout();
  const [avcbs, setAvcbs] = useState<AVCB[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAVCBs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await avcbService.getAll() as any;
      if (data && data.content) {
        setAvcbs(data.content);
      } else {
        setAvcbs(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar AVCBs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchAVCBs();
  }, [fetchAVCBs]);

  const handleDelete = async (id: number) => {
    try {
      await avcbService.delete(id);
      message.success('AVCB excluído com sucesso');
      fetchAVCBs();
    } catch (error: any) {
      message.error('Erro ao excluir AVCB: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/avcb/novo');
  };

  const handleEdit = (record: AVCB) => {
    navigate(`/avcb/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel AVCB' },
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
            Painel AVCB
          </Title>
          <Text type="secondary">Gerenciamento de Auto de Vistoria do Corpo de Bombeiros.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo AVCB
        </Button>
      </div>

      <AVCBFilters
        onSearch={(values) => console.log('Filtrar:', values)}
        onClear={() => console.log('Limpar filtros')}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            type="pie"
            title="Situação dos AVCBs"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              avcbs.reduce((acc: Record<string, number>, curr) => {
                acc[curr.situacao] = (acc[curr.situacao] || 0) + 1;
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
        <Col xs={24} lg={12}>
          <GenericChart
            title="Volume Financeiro por Status"
            subtitle="Total em contrato por situação (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              avcbs.reduce((acc: Record<string, number>, curr) => {
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
        <AVCBTable
          dataSource={avcbs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar AVCB: ${record.nf}`)}
        />
      </Card>
    </div>
  );
};
