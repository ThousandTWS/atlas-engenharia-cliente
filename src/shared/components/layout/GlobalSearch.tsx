import React from 'react';
import { AutoComplete, Input, Grid } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {useLayout} from './LayoutContext.tsx'

const { useBreakpoint } = Grid;


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
  const screens = useBreakpoint();
  const isLarge = screens.lg;
  const {isDarkMode} = useLayout();


  const onSelect = (value: string) => {
    const option = searchOptions.find((opt) => opt.value === value);
    if (option) {
      navigate(option.path);
    }
  };

  return (
    <AutoComplete
      popupMatchSelectWidth={isLarge ? 385 : true}
      style={{ width: isLarge ? 400 : '100%', maxWidth: isLarge ? 400 : 300 }}
      options={searchOptions.map(opt => ({ value: opt.value }))}
      onSelect={onSelect}
      filterOption={(inputValue, option) =>
        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
      }
      variant="borderless"
    >
      <Input
        size="large"
        placeholder="Pesquisar..."
        suffix={<SearchOutlined style={{ color:isDarkMode ? '#fff' : 'rgba(0,0,0,0.45)' }} />}
        style={{
          marginTop: isLarge ? 12 : 10,
          marginRight:12,
          borderRadius: '8px', 
          height: '40px', 
          width: '100%',
          backgroundColor: isDarkMode ? '#171C2A' :  '#f5f5f5',
          border: isDarkMode ? 'solid 1px #1E2A47' :'1px solid #d9d9d9',
        }}
      />
    </AutoComplete>
  );
};
