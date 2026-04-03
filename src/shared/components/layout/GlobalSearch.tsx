import React from 'react';
import { Input } from 'antd';
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

  void isDarkMode;

  const resolveTarget = (raw: string) => {
    const query = String(raw || '').trim().toLowerCase();
    if (!query) return null;

    const exact = searchOptions.find((opt) => opt.value.toLowerCase() === query);
    if (exact) return exact;

    const startsWith = searchOptions.find((opt) => opt.value.toLowerCase().startsWith(query));
    if (startsWith) return startsWith;

    const contains = searchOptions.find((opt) => opt.value.toLowerCase().includes(query));
    return contains ?? null;
  };

  return (
    <Input.Search
      size="large"
      allowClear
      placeholder="Pesquisar..."
      className="atlas-global-search"
      onSearch={(value) => {
        const target = resolveTarget(value);
        if (target) {
          navigate(target.path);
        }
      }}
      onPressEnter={(event) => {
        const target = resolveTarget((event.target as HTMLInputElement).value);
        if (target) {
          navigate(target.path);
        }
      }}
    />
  );
};
