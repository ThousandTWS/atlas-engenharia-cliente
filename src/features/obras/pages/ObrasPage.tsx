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
import { ObrasTable } from '../components/ObrasTable';
import { ObrasFilters } from '../components/ObrasFilters';
import { GenericChart } from '../../../shared/components/charts/GenericChart';
import { obrasService } from '../../../core/services/obrasService';
import type { Obra } from '../../../core/services/obrasService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const ObrasPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode } = useLayout();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const fetchObras = useCallback(async (page = 1, pageSize = DEFAULT_PAGE_SIZE, currentFilters: any = {}) => {
    setLoading(true);
    try {
      const data = await obrasService.getAll({
        page: page - 1,
        size: pageSize,
        ...currentFilters,
      });
      setObras(data.content);
      setPagination({
        current: page,
        pageSize,
        total: data.totalElements,
      });
    } catch (error: any) {
      message.error('Erro ao carregar obras: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchObras(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchObras]);

  const handleTableChange = (newPagination: any) => {
    fetchObras(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (values: any) => {
    const formattedFilters: any = { ...values };
    if (values.periodo && values.periodo.length === 2) {
      formattedFilters.dataContratoInicio = values.periodo[0].format('YYYY-MM-DD');
      formattedFilters.dataContratoFim = values.periodo[1].format('YYYY-MM-DD');
      delete formattedFilters.periodo;
    }
    setFilters(formattedFilters);
    fetchObras(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchObras(1, pagination.pageSize, {});
  };

  const handleDelete = async (id: number) => {
    try {
      await obrasService.delete(id);
      message.success('Obra excluída com sucesso');
      fetchObras(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error('Erro ao excluir obra: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/obras/novo');
  };

  const handleEdit = (record: any) => {
    if (!record?.id) {
      message.warning('Obra inválida para edição.');
      return;
    }
    navigate(`/obras/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Painel de Obras' },
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
            Painel de Obras
          </Title>
          <Text type="secondary">Gerencie todas as obras, contratos e financeiro em um só lugar.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Nova Obra
        </Button>
      </div>

      <ObrasFilters
        onSearch={handleSearch}
        onClear={handleClear}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GenericChart
            title="Situação das Obras"
            subtitle="Distribuição por status atual"
            loading={loading}
            data={Object.entries(
              obras.reduce((acc: Record<string, number>, curr) => {
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
            title="Volume por Cliente"
            subtitle="Total em contrato por cliente (R$)"
            loading={loading}
            valuePrefix="R$"
            data={Object.entries(
              obras.reduce((acc: Record<string, number>, curr) => {
                const cliente = curr.nomeCliente || 'Não informado';
                acc[cliente] = (acc[cliente] || 0) + (curr.valorContrato || 0);
                return acc;
              }, {}),
            ).map(([label, value]) => ({
              label,
              value,
            })).sort((a, b) => b.value - a.value).slice(0, 5)}
          />
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <ObrasTable
          dataSource={obras}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Visualizar obra: ${record.codigo}`)}
        />
      </Card>
    </div>
  );
};
