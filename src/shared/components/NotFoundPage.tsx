import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Desculpe, a página que você visitou não existe."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Voltar para Home
        </Button>
      }
    />
  );
};
