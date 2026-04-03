import React from 'react';
import { AutoComplete, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLayout } from './LayoutContext.tsx';

const searchOptions = [
  { value: 'Insights', path: '/' },
  { value: 'Gestão de Processos', path: '/processos' },
  { value: 'Painel CLCB', path: '/clcb' },
  { value: 'Painel AVCB', path: '/avcb' },
  { value: 'Painel de Obras', path: '/obras' },
  { value: 'Nova Obra', path: '/obras' },
];

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useLayout();


  const onSelect = (value: string) => {
    const option = searchOptions.find((opt) => opt.value === value);
    if (option) {
      navigate(option.path);
    }
  };

  return (
    <AutoComplete
      popupMatchSelectWidth
      className="atlas-global-search"
      style={{ width: '100%' }}
      options={searchOptions.map(opt => ({ value: opt.value }))}
      onSelect={onSelect}
      filterOption={(inputValue, option) =>
        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
      }
      variant="borderless"
    >
      <Input
        size="middle"
        placeholder="Pesquisar..."
        className="atlas-global-search__input"
        suffix={<SearchOutlined style={{ color: isDarkMode ? '#e2e8f0' : 'rgba(0,0,0,0.45)' }} />}
      />
    </AutoComplete>
  );
};
