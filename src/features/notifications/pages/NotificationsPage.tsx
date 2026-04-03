import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import type { NotificationCategory, NotificationItem, NotificationServiceType } from '../../../core/notifications/NotificationCenterContext';
import { notificationsService, type BackendNotification, type BackendNotificationCategory, type BackendNotificationServiceType } from '../../../core/services/notificationsService';
import { ExcelLikeTable } from '../../../shared/components/table/ExcelLikeTable';

const { Title, Text } = Typography;

type CategoryFilter = 'all' | NotificationCategory;
type ServiceTypeFilter = 'all' | NotificationServiceType;

const categoryOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Técnico', value: 'technical' },
  { label: 'Financeiro', value: 'financial' },
] satisfies { label: string; value: CategoryFilter }[];

const serviceTypeOptions = [
  { label: 'Todos os serviços', value: 'all' },
  { label: 'AVCB', value: 'AVCB' },
  { label: 'CLCB', value: 'CLCB' },
  { label: 'Obras', value: 'OBRAS' },
  { label: 'Proc. Adm.', value: 'PROCESSOS_ADM' },
] satisfies { label: string; value: ServiceTypeFilter }[];

const typeLabel: Record<NotificationItem['type'], string> = {
  info: 'Info',
  success: 'Sucesso',
  warning: 'Alerta',
  error: 'Crítico',
};

const categoryLabel: Record<NotificationCategory, string> = {
  technical: 'Técnico',
  financial: 'Financeiro',
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const mapCategoryToBackend = (value: CategoryFilter | undefined): BackendNotificationCategory | undefined => {
  if (!value || value === 'all') return undefined;
  return value === 'technical' ? 'TECNICA' : 'FINANCEIRA';
};

const mapServiceTypeToBackend = (value: ServiceTypeFilter | undefined): BackendNotificationServiceType | undefined => {
  if (!value || value === 'all') return undefined;
  return value;
};

const mapBackendCategoryToUi = (value: BackendNotificationCategory): NotificationCategory =>
  value === 'TECNICA' ? 'technical' : 'financial';

const mapBackendServiceTypeToUi = (value?: BackendNotificationServiceType | null): NotificationServiceType | undefined =>
  value === 'AVCB' || value === 'CLCB' || value === 'OBRAS' || value === 'PROCESSOS_ADM' ? value : undefined;

const resolveUiType = (notification: BackendNotification): NotificationItem['type'] => {
  const title = (notification.title || '').toLowerCase();
  if (title.includes('parado') || title.includes('erro')) return 'error';
  if (notification.category === 'FINANCEIRA') return 'warning';
  return 'info';
};

export const NotificationsPage: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 20;
  const { message } = App.useApp();
  const { isMobile, isDarkMode } = useLayout();
  const [form] = Form.useForm();
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmationCount, setPendingConfirmationCount] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  const values = Form.useWatch([], form) as {
    category?: CategoryFilter;
    serviceType?: ServiceTypeFilter;
    minValue?: number;
    maxValue?: number;
  } | undefined;

  const fetchNotifications = useCallback(async (
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    currentFilters?: {
      category?: CategoryFilter;
      serviceType?: ServiceTypeFilter;
      minValue?: number;
      maxValue?: number;
    },
  ) => {
    setLoading(true);
    try {
      const response = await notificationsService.list({
        page,
        pageSize,
        category: mapCategoryToBackend(currentFilters?.category),
        serviceType: mapServiceTypeToBackend(currentFilters?.serviceType),
        amountMin: currentFilters?.minValue,
        amountMax: currentFilters?.maxValue,
      });

      const mapped = response.data.map((item) => ({
        id: String(item.id),
        title: item.title,
        description: item.message,
        timestamp: item.lastActive ?? item.createdAt,
        type: resolveUiType(item),
        category: mapBackendCategoryToUi(item.category),
        serviceType: mapBackendServiceTypeToUi(item.serviceType),
        amount: typeof item.amount === 'number' ? item.amount : undefined,
        origin: 'manual' as const,
        read: item.isRead,
        confirmedAt: item.confirmedAt ?? undefined,
        source: 'server' as const,
      } satisfies NotificationItem));

      setRows(mapped);
      setPendingConfirmationCount(Number(response.pendingConfirmationCount ?? 0));
      setPagination({
        current: page,
        pageSize,
        total: Number(response.totalData ?? 0),
      });
    } catch (error) {
      message.error(`Erro ao carregar notificações: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_PAGE_SIZE, message]);

  useEffect(() => {
    void fetchNotifications(1, DEFAULT_PAGE_SIZE, { category: 'all', serviceType: 'all' });
  }, [DEFAULT_PAGE_SIZE, fetchNotifications]);

  const columns = useMemo(() => [
    {
      title: 'Data/hora',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      excel: { disable: true },
      render: (value: string) =>
        new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)),
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      excel: { disable: true },
      render: (value: NotificationCategory) => (
        <Tag color={value === 'financial' ? 'gold' : 'geekblue'} style={{ marginInlineEnd: 0 }}>
          {categoryLabel[value]}
        </Tag>
      ),
    },
    {
      title: 'Tipo de serviço',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 140,
      excel: { disable: true },
      render: (value?: NotificationServiceType) => value ? (value === 'PROCESSOS_ADM' ? 'Proc. Adm.' : value) : '-',
    },
    {
      title: 'Valor',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      excel: { disable: true },
      render: (value?: number) => (value === undefined ? '-' : formatCurrency(value)),
    },
    {
      title: 'Severidade',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      excel: { disable: true },
      render: (value: NotificationItem['type']) => <Tag style={{ marginInlineEnd: 0 }}>{typeLabel[value]}</Tag>,
    },
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      width: 320,
      ellipsis: true,
      excel: { disable: true },
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      excel: { disable: true },
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      excel: { disable: true },
      render: (_: unknown, record: NotificationItem) => (
        <Space size={6} wrap>
          <Tag color={record.read ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
            {record.read ? 'Lida' : 'Não lida'}
          </Tag>
          <Tag color={record.confirmedAt ? 'green' : 'orange'} style={{ marginInlineEnd: 0 }}>
            {record.confirmedAt ? 'Confirmada' : 'Pendente'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 170,
      fixed: 'right' as const,
      excel: { disable: true },
      render: (_: unknown, record: NotificationItem) => (
        <Space wrap>
          {!record.read && (
            <Button
              size="small"
              className="atlas-services-button"
              onClick={() => void notificationsService.markAsRead(record.id, true).then(() => fetchNotifications(pagination.current, pagination.pageSize, values)).catch((error) => {
                message.error(`Falha ao marcar como lida: ${(error as Error).message}`);
              })}
            >
              Marcar lida
            </Button>
          )}
          <Button
            size="small"
            className={record.confirmedAt ? 'atlas-services-button' : 'atlas-services-button atlas-services-button-primary'}
            disabled={Boolean(record.confirmedAt)}
            onClick={() => void notificationsService.confirm(record.id).then(() => fetchNotifications(pagination.current, pagination.pageSize, values)).catch((error) => {
              message.error(`Falha ao confirmar: ${(error as Error).message}`);
            })}
          >
            {record.confirmedAt ? 'Confirmada' : 'Confirmar'}
          </Button>
        </Space>
      ),
    },
  ], [fetchNotifications, message, pagination.current, pagination.pageSize, values]);

  const handleTableChange: TableProps<any>['onChange'] = (nextPagination) => {
    const pageSize = (nextPagination as any)?.pageSize ?? pagination.pageSize;
    const current = (nextPagination as any)?.current ?? pagination.current;
    void fetchNotifications(current, pageSize, values);
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <Space direction="vertical" size={2}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            Central de Notificações
          </Title>
          <Text type="secondary">
            Visão completa, com filtros por tipo de serviço, valor e categoria.
          </Text>
        </Space>

        <Space wrap>
          <Tag className="atlas-dashboard-meta-chip" bordered={false} color={pendingConfirmationCount > 0 ? 'gold' : 'green'}>
            {pendingConfirmationCount} pendente(s)
          </Tag>
          <Button
            className="atlas-services-button"
            icon={<ReloadOutlined />}
            onClick={() => void fetchNotifications(pagination.current, pagination.pageSize, values).then(() => message.success('Notificações atualizadas.')).catch(() => message.error('Falha ao atualizar.'))}
          >
            Atualizar
          </Button>
        </Space>
      </div>

      <Card
        className="atlas-services-filter-card"
        bordered={false}
        style={{ marginBottom: 16, background: isDarkMode ? '#0A0F1C' : '#FAFBFC' }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ category: 'all', serviceType: 'all' }}
          onFinish={() => void fetchNotifications(1, pagination.pageSize, form.getFieldsValue())}
        >
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} md={8} lg={6}>
              <Form.Item name="category" label="Categoria">
                <Select className="atlas-services-select" options={categoryOptions as any} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} lg={6}>
              <Form.Item name="serviceType" label="Tipo de serviço">
                <Select className="atlas-services-select" options={serviceTypeOptions as any} />
              </Form.Item>
            </Col>
            <Col xs={12} md={4} lg={4}>
              <Form.Item name="minValue" label="Valor mín.">
                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={12} md={4} lg={4}>
              <Form.Item name="maxValue" label="Valor máx.">
                <InputNumber className="atlas-services-number" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={24} lg={4}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  className="atlas-services-button"
                  onClick={() => {
                    form.resetFields();
                    void fetchNotifications(1, pagination.pageSize, { category: 'all', serviceType: 'all' });
                  }}
                  style={{ width: isMobile ? '100%' : 'auto' }}
                >
                  Limpar
                </Button>
                <Button
                  className="atlas-services-button atlas-services-button-primary"
                  type="primary"
                  htmlType="submit"
                  style={{ width: isMobile ? '100%' : 'auto' }}
                >
                  Filtrar
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card className="atlas-services-table-card" bordered={false} styles={{ body: { padding: 0 } }}>
        <ExcelLikeTable
          tableId="notificacoes"
          rowKey="id"
          dataSource={rows}
          loading={loading}
          columns={columns as any}
          scroll={{ x: 1400 }}
          pagination={{
            placement: ['bottomCenter'],
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} registros`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};
