# Atlas Engenharia - Cliente

Projeto organizado com as melhores práticas de 2026, utilizando **React 19**, **Vite 7**, **TypeScript 5** e **Ant Design 5**.

## Estrutura do Projeto

A estrutura segue o padrão **Feature-First Architecture**, focada em escalabilidade e manutenibilidade:

- `src/core/`: Configurações globais, provedores de contexto, temas, estilos globais e **roteamento**.
- `src/core/routes/`: Configuração das rotas da aplicação usando `react-router-dom`.
- `src/features/`: Módulos de negócio. Cada funcionalidade contém seus próprios componentes, hooks e serviços.
- `src/shared/`: Recursos compartilhados entre múltiplas features (componentes de UI, hooks utilitários, assets).
- `src/shared/components/`: Componentes atômicos ou moleculares reutilizáveis.
- `src/shared/hooks/`: Custom hooks de uso geral.
- `src/shared/utils/`: Funções utilitárias e helpers.

## Tecnologias Principais

- **Ant Design (antd)**: Sistema de design robusto com suporte a Design Tokens.
- **TypeScript**: Tipagem estática para maior segurança.
- **Vite**: Ferramenta de build ultra-rápida.

## Scripts

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera o build de produção.
- `npm run lint`: Executa a verificação de linting.
