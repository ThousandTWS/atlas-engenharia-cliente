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
import dayjs from 'dayjs';
import { LancamentosTable } from '../components/LancamentosTable';
import type { Lancamento } from '../components/LancamentosTable';
import { LancamentosFilters } from '../components/LancamentosFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { lancamentosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const LancamentosPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lancamentosService.getAll() as any;
      if (data && data.content) {
        setLancamentos(data.content);
      } else {
        setLancamentos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar lançamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchLancamentos();
  }, [fetchLancamentos]);

  const handleDelete = async (id: number) => {
    try {
      await lancamentosService.delete(id);
      message.success('Lançamento excluído com sucesso');
      fetchLancamentos();
    } catch (error: any) {
      message.error('Erro ao excluir lançamento: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/lancamentos/novo');
  };

  const handleEdit = (record: Lancamento) => {
    navigate(`/lancamentos/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Financeiro' },
          { title: 'Lançamentos' },
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
            Gestão de Lançamentos
          </Title>
          <Text type="secondary">Acompanhe faturamentos, custos e lucratividade dos seus projetos.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Lançamento
        </Button>
      </div>

      <LancamentosFilters
        onSearch={(values) => console.log('Filtrar:', values)}
        onClear={() => console.log('Limpar filtros')}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Evolução Mensal"
            subtitle="Faturamento bruto por mês (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              lancamentos.reduce((acc: Record<string, number>, curr) => {
                const month = dayjs(curr.data).format('MMM/YY');
                acc[month] = (acc[month] || 0) + (curr.faturamento || 0);
                return acc;
              }, {}),
            ).map(([label, value]) => ({
              label,
              value,
            })).slice(-6)}
          />
        </Col>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Lucratividade"
            subtitle="Lucro líquido por lançamento (R$)"
            loading={loading}
            valuePrefix="R$"
            data={lancamentos.slice(-6).map((l) => ({
              label: l.obra || 'S/N',
              value: (l.lucro || 0),
              color: (l.lucro || 0) > 0 ? '#52c41a' : '#ff4d4f',
            }))}
          />
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <LancamentosTable
          dataSource={lancamentos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar lançamento: ${record.codigo}`)}
        />
      </Card>
    </div>
  );
};
