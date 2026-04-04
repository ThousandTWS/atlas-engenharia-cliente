# Documentação (Páginas e Funcionalidades)

Este diretório concentra documentação de apoio do projeto (incluindo conteúdo legal como Termos e Política de Privacidade).

## Rotas do sistema

As rotas estão definidas em `src/core/routes/router.tsx`.

### Principal (autenticado)

- `/` → **Insights / Central de performance** (`src/features/home/pages/HomePage.tsx`)
  - Dashboard executivo com banner de boas-vindas e gráficos (`WelcomeBanner`, `ExecutiveDashboard`).

- `/notificacoes` → **Central de Notificações** (`src/features/notifications/pages/NotificationsPage.tsx`)
  - Lista com filtros (categoria, tipo de serviço e faixa de valor).
  - Ações por notificação: marcar como lida e confirmar.
  - Tabela com recursos “Excel-like” (`ExcelLikeTable`).

- `/acompanhamento-servicos` → **Acompanhamento de Serviços** (`src/features/services/pages/ServicesTrackingPage.tsx`)
  - Acompanhamento unificado de CLCB, AVCB, Obras e Processos Administrativos.
  - Filtros por tipo + busca por código/cliente/telefone/subtipo/situação.
  - Detalhes em `Drawer` (edição rápida, pendências e controle de situação).
  - Configuração de situações por tipo de serviço (modal).
  - Geração de PDF “Relatório do acompanhamento” via template (`pdfTemplatesService`, key `service_report`).
  - Atalho para agendar vistoria no Google Agenda (salva rascunho localmente no navegador).

- `/cadastros` → **Central de Cadastros** (`src/features/cadastros/pages/CadastrosHubPage.tsx`)
  - Resumo de orçamentos, serviços e prestadores.
  - Atalhos para as páginas de cadastro.

- `/cadastros/orcamentos` → **Cadastro de Orçamento** (`src/features/cadastros/pages/BudgetRegisterPage.tsx`)
  - CRUD de orçamentos em tabela (`ExcelLikeTable`).
  - CRUD de “Situações de orçamento” (painel dedicado).

- `/cadastros/servicos` → **Cadastro Único Serviço / Cliente** (`src/features/cadastros/pages/ServiceClientRegisterPage.tsx`)
  - Tela única com: dados do cliente, dados do serviço, resumo financeiro, parcelas e prestadores vinculados.
  - Vincular orçamento existente e exibir código vinculado.
  - Validação de parcelas (soma precisa fechar o total líquido).
  - CRUD de condições de pagamento.
  - Geração de PDF “Pedido de compra” via template (`pdfTemplatesService`, key `purchase_order`).
  - “Cadastros recentes” (tabela com últimos serviços).

- `/cadastros/prestadores` → **Cadastro de Prestadores** (`src/features/cadastros/pages/ProvidersRegisterPage.tsx`)
  - CRUD de prestadores.
  - Drawer para visualizar serviços vinculados ao prestador.

- `/processos` → **Processos Adm** (`src/features/processos-adm/pages/ProcessosAdmPage.tsx`)
  - Listagem com filtros e tabela (componentes `ProcessosAdmFilters` e `ProcessosAdmTable`).
  - Integração de filtros do `ExcelLikeTable` para o backend (ex.: situação, período, intervalo numérico).
  - Cards/métricas com filtro por período (`useMetricCardFilters`).

- `/processos/novo` e `/processos/:id/editar` → **Processo Adm (Form)** (`src/features/processos-adm/pages/ProcessoAdmFormPage.tsx`)
  - Cadastro/edição com sessão de identificação/status e financeiro.
  - Cálculos auxiliares a partir de valores do formulário (contrato/recebido/custos/a receber/saldo).

- `/clcb` → **Painel CLCB** (`src/features/clcb/pages/CLCBPage.tsx`)
  - Visão de processos e indicadores (gráficos + tabela).
  - Filtros e navegação para novo/editar.

- `/clcb/novo` e `/clcb/:id/editar` → **CLCB (Form)** (`src/features/clcb/pages/CLCBFormPage.tsx`)
  - Cadastro/edição com sessões de identificação/status e financeiro.

- `/avcb` → **Painel AVCB** (`src/features/avcb/pages/AVCBPage.tsx`)
  - Visão de processos e indicadores (gráficos + tabela).
  - Filtros e navegação para novo/editar.

- `/avcb/novo` e `/avcb/:id/editar` → **AVCB (Form)** (`src/features/avcb/pages/AVCBFormPage.tsx`)
  - Cadastro/edição com sessões de informações do processo e financeiro.

- `/obras` → **Painel de Obras** (`src/features/obras/pages/ObrasPage.tsx`)
  - Listagem com filtros, ações de editar e excluir.

- `/obras/novo` e `/obras/:id/editar` → **Obra (Form)** (`src/features/obras/pages/ObraFormPage.tsx`)
  - Cadastro/edição com sessões de informações do cliente/serviço e financeiro.

- `/custos-indiretos` → **Custos Indiretos** (`src/features/custos-indiretos/pages/CustosIndiretosPage.tsx`)
  - Listagem com filtros e tabela.
  - Importação de planilha (modal “Importar custos indiretos”).

- `/custos-indiretos/novo` e `/custos-indiretos/:id/editar` → **Custo Indireto (Form)** (`src/features/custos-indiretos/pages/CustoIndiretoFormPage.tsx`)
  - Cadastro/edição de despesas (sessão “Informações da Despesa”).

- `/lancamentos` → **Lançamentos Financeiros** (`src/features/lancamentos/pages/LancamentosPage.tsx`)
  - Resumo financeiro (Total, Pago, A pagar, Previsto).
  - Tabela com recursos “Excel-like” (`ExcelLikeTable`).
  - Importação de arquivo do Inter e do Asaas (modal de importação).

- `/lancamentos/novo` e `/lancamentos/:id/editar` → **Lançamento (Form)** (`src/features/lancamentos/pages/LancamentoFormPage.tsx`)
  - Cadastro/edição do lançamento (sessão “Dados do lançamento”).

- `/gestao-de-clientes` → **Gestão de Clientes** (`src/features/gestao-de-clientes/page/GestaoDeClientes.tsx`)
  - Listagem paginada via `clientesService.getAll`.
  - Filtros (`ClientesFilters`) e tabela (`ClientesTable`).
  - Indicadores da página atual (clientes, cidades e estados).

- `/gestao-de-clientes/novo` e `/gestao-de-clientes/:id/editar` → **Cliente (Form)** (`src/features/gestao-de-clientes/page/ClienteFormPage.tsx`)
  - Cadastro/edição com dados cadastrais + endereço.
  - Busca de endereço por CEP (integração com `cepService`).

- `/gestao-ads` → **Gestão Ads** (`src/features/gestao-ads/pages/GestaoAdsPage.tsx`)
  - Indicadores (campanhas, ativas, custo 30 dias, ROAS e taxa de conversão).
  - Gráfico e tabela de performance (`AdsPerformanceChart`, `CampaignPerformanceTable`).
  - “Atualizar Dados” limpa cache do facade (`adsDashboardFacade.clearCache`).

- `/gestao-ads/chat` → **Chat (Gemini)** (`src/features/gestao-ads/pages/GeminiChatPage.tsx`)
  - Renderiza `GeminiChatCard`.

- `/profile` → **Meu Perfil** (`src/features/profile/pages/ProfilePage.tsx`)
  - Dados do usuário (com campos copiáveis) e logout.
  - Toggles de preferências (tema, breadcrumbs e busca global).

- `/profile/configuracoes` → **Configurações** (`src/features/profile/pages/ProfileSettingsPage.tsx`)
  - Preferências de interface (tema, breadcrumbs, busca global).
  - Encerrar sessão (logout).

- `*` → **Not Found** (`src/shared/components/NotFoundPage.tsx`)

### Autenticação (público)

- `/auth/login` → Login (`src/features/auth/pages/LoginPage.tsx`)
- `/auth/register` → Cadastro (`src/features/auth/pages/RegisterPage.tsx`)
- `/auth/verify-email` → Validação de e-mail (`src/features/auth/pages/VerifyEmailPage.tsx`)
- `/auth/forgot-password` → Esqueci minha senha (`src/features/auth/pages/ForgotPasswordPage.tsx`)
- `/auth/reset-password` → Redefinir senha (`src/features/auth/pages/ResetPasswordPage.tsx`)

## Funcionalidades transversais (infra/UI)

- **Proteção de rotas**: `src/core/components/ProtectedRoute.tsx` redireciona para `/auth/login` quando não autenticado.
- **Layout (Header/Sider)**: `src/shared/components/layout/AppHeader.tsx`, `src/shared/components/layout/AppSider.tsx`, `src/shared/components/layout/AppFooter.tsx`.
- **Tema escuro**: `src/shared/components/layout/LayoutContext.tsx` (persistência em `localStorage` e classe `dark` no `html`).
- **Preferências de UI** (breadcrumbs e busca global): `src/shared/components/layout/uiPreferences.ts`.
- **Notificações globais**: dropdown e drawer (`src/shared/components/layout/NotificationDropdown.tsx`, `src/shared/components/layout/NotificationDrawer.tsx`).
- **AI Drawer global**: `src/features/ai/components/GlobalAiAssistantDrawer.tsx` (toggle via `src/features/ai/context/GlobalAiDrawerContext.tsx`).
- **Tabela “Excel-like”**: `src/shared/components/table/ExcelLikeTable.tsx`
  - Persistência por usuário + `tableId` (colunas ocultas, filtros, ordenação e larguras).
  - Filtros automáticos (lista / mês-ano / intervalo numérico) e exportação CSV.

## Conteúdo legal

- Termos de Serviço: `src/docs/Termos/index.readm.md`
- Política de Privacidade: `src/docs/Política Privacidade/index.readm.md`

