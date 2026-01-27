import { Button, Typography, Space } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const HomePage = () => {
  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
      <Title>Bem-vindo ao Atlas Engenharia</Title>
      <Text style={{ fontSize: '16px' }}>
        Projeto em Desenvolvimento
      </Text>
      <Button type="primary" size="large" icon={<RocketOutlined />}>
        Em breve
      </Button>
    </Space>
  );
};
