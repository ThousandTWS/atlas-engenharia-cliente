/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Breadcrumb,
  App,
} from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ContactsOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import type { Cliente } from '../../../core/services/clientesService';
import { clientesService } from '../../../core/services/clientesService';
import { ClientesTable } from '../components/ClientesTable';
import { ClientesFilters } from '../components/ClientesFilters';

const { Title, Text } = Typography;

export const GestaoClientesPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 10;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isMobile, isDarkMode } = useLayout();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const fetchClientes = useCallback(async (page = 1, pageSize = DEFAULT_PAGE_SIZE, currentFilters: any = {}) => {
    setLoading(true);
    try {
      const response = await clientesService.getAll({
        ...currentFilters,
        page: page - 1,
        size: pageSize,
      }) as any;

      if (response && response.content) {
        setClientes(response.content);
        setPagination({
          current: page,
          pageSize,
          total: response.totalElements ?? 0,
        });
      } else {
        const arrayData = Array.isArray(response) ? response : [];
        setClientes(arrayData);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total: arrayData.length,
        }));
      }
    } catch (error: any) {
      message.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchClientes(1, DEFAULT_PAGE_SIZE, {});
  }, [fetchClientes]);

  const handleTableChange = (newPagination: any) => {
    fetchClientes(newPagination.current, newPagination.pageSize, filters);
  };

  const handleSearch = (values: any) => {
    const formattedFilters = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );

    setFilters(formattedFilters);
    fetchClientes(1, pagination.pageSize, formattedFilters);
  };

  const handleClear = () => {
    setFilters({});
    fetchClientes(1, pagination.pageSize, {});
  };

  const handleDelete = async (id: number) => {
    try {
      await clientesService.delete(id);
      message.success('Cliente excluído com sucesso');
      fetchClientes(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error('Erro ao excluir cliente: ' + error.message);
    }
  };

  const handleOpenAddPage = () => {
    navigate('/gestao-de-clientes/novo');
  };

  const handleEdit = (record: Cliente) => {
    navigate(`/gestao-de-clientes/${record.id}/editar`);
  };

  const cidadesUnicas = new Set(clientes.map((cliente) => cliente.cidade).filter(Boolean)).size;
  const estadosUnicos = new Set(clientes.map((cliente) => cliente.estado).filter(Boolean)).size;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/' },
          { title: 'Gestões' },
          { title: 'Gestão de Clientes' },
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
            Gestão de Clientes
          </Title>
          <Text type="secondary">Cadastro e gerenciamento completo de clientes e contatos.</Text>
        </Space>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenAddPage}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Novo Cliente
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card style={{ background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1' }}>
            <Statistic title="Clientes na página" value={clientes.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1' }}>
            <Statistic title="Cidades (página atual)" value={cidadesUnicas} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? '1px solid #1E2A47' : '1px solid #CBD5E1' }}>
            <Statistic title="Estados (página atual)" value={estadosUnicos} prefix={<ContactsOutlined />} />
          </Card>
        </Col>
      </Row>

      <ClientesFilters onSearch={handleSearch} onClear={handleClear} />

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <ClientesTable
          dataSource={clientes}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(record) => message.info(`Cliente: ${record.razaoSocial}`)}
        />
      </Card>
    </div>
  );
};
