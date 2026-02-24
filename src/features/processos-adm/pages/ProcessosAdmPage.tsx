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
import { ProcessosAdmTable } from '../components/ProcessosAdmTable';
import type { ProcessoAdm } from '../components/ProcessosAdmTable';
import { ProcessosAdmFilters } from '../components/ProcessosAdmFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { processosAdmService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const ProcessosAdmPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode } = useLayout();
  const [processos, setProcessos] = useState<ProcessoAdm[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await processosAdmService.getAll() as any;
      if (data && data.content) {
        setProcessos(data.content);
      } else {
        setProcessos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar processos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const handleDelete = async (id: number) => {
    try {
      await processosAdmService.delete(id);
      message.success('Processo administrativo excluído com sucesso');
      fetchProcessos();
    } catch (error: any) {
      message.error('Erro ao excluir processo: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/processos/novo');
  };

  const handleEdit = (record: ProcessoAdm) => {
    navigate(`/processos/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestão' },
          { title: 'Processos Administrativos' },
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
            Processos Administrativos
          </Title>
          <Text type="secondary">Gerenciamento de contratos, parcelas e financeiro administrativo.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Processo
        </Button>
      </div>

      <ProcessosAdmFilters
        onSearch={(values) => console.log('Filtrar:', values)}
        onClear={() => console.log('Limpar filtros')}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Situação dos Processos"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              processos.reduce((acc: Record<string, number>, curr) => {
                const situacao = curr.situacao || 'PENDENTE';
                acc[situacao] = (acc[situacao] || 0) + 1;
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
              processos.reduce((acc: Record<string, number>, curr) => {
                const situacao = curr.situacao || 'PENDENTE';
                acc[situacao] = (acc[situacao] || 0) + (curr.valorContrato || 0);
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
        <ProcessosAdmTable
          dataSource={processos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar processo: ${record.codigo}`)}
        />
      </Card>
    </div>
  );
};
