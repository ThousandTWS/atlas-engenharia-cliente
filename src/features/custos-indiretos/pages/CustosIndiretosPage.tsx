import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Breadcrumb,
  Modal,
  App,
} from 'antd';
import {
  SaveOutlined,
  HomeOutlined,
  PlusOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CustosIndiretosTable } from '../components/CustosIndiretosTable';
import type { CustoIndireto } from '../components/CustosIndiretosTable';
import { CustosIndiretosFilters } from '../components/CustosIndiretosFilters';
import { CustosIndiretosChart } from '../components/CustosIndiretosChart';
import { custosIndiretosService } from '../../../core/services/genericService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const CustosIndiretosPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const {isMobile,sideBarWidth, isDarkMode } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoIndireto | null>(null);
  const [custos, setCustos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const fetchCustos = async (page = pagination.current, pageSize = pagination.pageSize, currentFilters = filters) => {
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
          pageSize: pageSize,
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
  };

  useEffect(() => {
    fetchCustos();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchCustos(newPagination.current, newPagination.pageSize);
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

  const onFinish = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        data: values.data.format('YYYY-MM-DD'),
      };

      if (editingCusto) {
        await custosIndiretosService.update(editingCusto.id!, formattedValues);
        message.success('Custo indireto atualizado com sucesso');
      } else {
        await custosIndiretosService.create(formattedValues);
        message.success('Custo indireto cadastrado com sucesso');
      }
      setIsModalOpen(false);
      setEditingCusto(null);
      form.resetFields();
      fetchCustos();
    } catch (error: any) {
      message.error('Erro ao salvar custo: ' + error.message);
    }
  };

  const handleEdit = (record: CustoIndireto) => {
    setEditingCusto(record);
    form.setFieldsValue({
      ...record,
      data: dayjs(record.data),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await custosIndiretosService.delete(id);
      message.success('Custo indireto excluído com sucesso');
      fetchCustos();
    } catch (error: any) {
      message.error('Erro ao excluir custo: ' + error.message);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCusto(null);
    form.resetFields();
    setIsModalOpen(true);
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

      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
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
          onClick={handleOpenAddModal}
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

      <Modal
        title={editingCusto ? 'Editar Custo Indireto' : 'Cadastrar Novo Custo Indireto'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        footer={null}
        destroyOnHidden
        style={{
            top:20,
            paddingLeft: isMobile ? 0 : (sideBarWidth / 2 * 2),
            transition: 'padding-left 0.2s ease'}}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            data: dayjs(),
          }}
        >
          <Card
            title={<span><FileTextOutlined /> Informações da Despesa</span>}
            style={{ marginBottom: 24, borderRadius: 8,  background: isDarkMode ? '#0A0F1C' : '#FAFBFC', border: isDarkMode ? 'none' : '1px solid #CBD5E1'}}
          >
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="descricao"
                  label="Descrição"
                  rules={[{ required: true, message: 'Por favor, insira a descrição' }]}
                >
                  <Input style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Ex: Aluguel de escritório" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="categoria"
                  label="Categoria"
                  rules={[{ required: true, message: 'Selecione a categoria' }]}
                >
                  <Select style={{background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}} placeholder="Selecione">
                    <Option value="Administrativo">Administrativo</Option>
                    <Option value="Infraestrutura">Infraestrutura</Option>
                    <Option value="Pessoal">Pessoal</Option>
                    <Option value="Marketing">Marketing</Option>
                    <Option value="Outros">Outros</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="data"
                  label="Data"
                  rules={[{ required: true, message: 'Selecione a data' }]}
                >
                  <DatePicker style={{ width: '100%' , background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="valor"
                  label="Valor"
                  rules={[{ required: true, message: 'Insira o valor' }]}
                >
                  <InputNumber
                    style={{ width: '100%' , background: isDarkMode ? '#171C2A' : '#fff', border: isDarkMode ? 'none' : 'solid 1px #CBD5E1'}}
                    size="large"
                    formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/R\$\s?|(\,)/g, '')}
                    prefix={<DollarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button style={{background: isDarkMode ? '#171C2A' : '#fff'}} onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
              {editingCusto ? 'Salvar Alterações' : 'Cadastrar Custo'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
