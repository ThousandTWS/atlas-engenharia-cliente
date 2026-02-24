/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
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
import { CustosIndiretosTable } from '../components/CustosIndiretosTable';
import type { CustoIndireto } from '../components/CustosIndiretosTable';
import { CustosIndiretosFilters } from '../components/CustosIndiretosFilters';
import { CustosIndiretosChart } from '../components/CustosIndiretosChart';
import { custosIndiretosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;

export const CustosIndiretosPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile } = useLayout();
  const [custos, setCustos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const fetchCustos = useCallback(async (page = 1, pageSize = DEFAULT_PAGE_SIZE, currentFilters: any = {}) => {
    setLoading(true);
    try {
      const data = await custosIndiretosService.getAll({
        page: page - 1,
        size: pageSize,
        ...currentFilters,
      }) as any;

      if (data && data.content) {
        setCustos(data.content);
        setPagination({
          current: page,
          pageSize,
          total: data.totalElements,
        });
      } else {
        setCustos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      message.error('Erro ao carregar custos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCustos(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchCustos]);

  const handleTableChange = (newPagination: any) => {
    fetchCustos(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (values: any) => {
    const formattedFilters: any = { ...values };
    if (values.dataInicio) {
      formattedFilters.dataInicio = values.dataInicio.format('YYYY-MM-DD');
    }
    if (values.dataFim) {
      formattedFilters.dataFim = values.dataFim.format('YYYY-MM-DD');
    }
    setFilters(formattedFilters);
    fetchCustos(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchCustos(1, pagination.pageSize, {});
  };

  const handleDelete = async (id: number) => {
    try {
      await custosIndiretosService.delete(id);
      message.success('Custo indireto excluído com sucesso');
      fetchCustos(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error('Erro ao excluir custo: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/custos-indiretos/novo');
  };

  const handleEdit = (record: CustoIndireto) => {
    navigate(`/custos-indiretos/${record.id}/editar`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Painéis e Gestão' },
          { title: 'Custos Indiretos' },
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
            Custos Indiretos
          </Title>
          <Text type="secondary">Gerencie despesas administrativas e operacionais fixas.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Custo
        </Button>
      </div>

      <CustosIndiretosFilters
        onSearch={handleSearch}
        onClear={handleClear}
      />

      <CustosIndiretosChart
        data={custos}
        loading={loading}
      />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <CustosIndiretosTable
          dataSource={custos}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
};
