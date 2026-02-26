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

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```bash
VITE_RECAPTCHA_SITE_KEY=sua_chave_publica_do_google_recaptcha
```

Esse valor é obrigatório para habilitar o reCAPTCHA nas telas de login e cadastro.

### Integração do módulo Ads com n8n

Para usar o módulo **Gestão Ads** via n8n:

```bash
# Fonte de dados do módulo Ads: backend (default) | n8n
VITE_ADS_DATA_SOURCE=n8n

# Opção A: base + caminhos
VITE_N8N_ADS_BASE_URL=https://seu-n8n.com/webhook
VITE_N8N_ADS_ENDPOINT_PERFORMANCE=/google-ads/performance
VITE_N8N_ADS_ENDPOINT_CAMPAIGNS=/google-ads/campaigns
VITE_N8N_ADS_ENDPOINT_INSIGHTS=/google-ads/insights
VITE_N8N_ADS_ENDPOINT_CHAT=/google-ads/chat

# Opção B: URLs completas (sobrescrevem base + endpoint)
# VITE_N8N_ADS_PERFORMANCE_URL=https://seu-n8n.com/webhook/google-ads/performance
# VITE_N8N_ADS_CAMPAIGNS_URL=https://seu-n8n.com/webhook/google-ads/campaigns
# VITE_N8N_ADS_INSIGHTS_URL=https://seu-n8n.com/webhook/google-ads/insights
# VITE_N8N_ADS_CHAT_URL=https://seu-n8n.com/webhook/google-ads/chat

# Chat IA global (opcional - usado pelo drawer Atlas AI em todo o app)
# VITE_N8N_AI_CHAT_URL=https://seu-n8n.com/webhook/global-ai/chat

# Autenticação do n8n: none | bearer | api_key
VITE_N8N_ADS_AUTH_TYPE=api_key
VITE_N8N_ADS_API_KEY=sua_chave
VITE_N8N_ADS_API_KEY_HEADER=x-api-key
# VITE_N8N_ADS_BEARER_TOKEN=seu_token_bearer

# Realtime opcional (WebSocket)
# VITE_REALTIME_WS_URL=wss://seu-realtime-endpoint

# Fallback de chat Gemini direto (quando n8n chat não estiver disponível)
# VITE_GEMINI_API_KEY=sua_chave_google_ai_studio
# VITE_GEMINI_MODEL=gemini-2.5-flash
# VITE_GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

Se `VITE_ADS_DATA_SOURCE=backend`, o frontend continuará usando os endpoints padrão:
- `GET /ads/performance`
- `GET /ads/campaigns`
- `POST /ads/insights`
- `POST /ads/chat`

Template pronto para import no n8n:
- [`docs/n8n/atlas-ads-webhooks.json`](docs/n8n/atlas-ads-webhooks.json)
- [`docs/n8n/atlas-ads-webhooks-googleads-real.json`](docs/n8n/atlas-ads-webhooks-googleads-real.json)

## Recursos implementados (conceitos refine)

- **Realtime**: provider de eventos (`src/core/realtime/liveProvider.ts`) com `subscribe/publish`, BroadcastChannel e suporte opcional a WebSocket.
- **Notifications**: central de notificações (`src/core/notifications/NotificationCenterContext.tsx`) integrada ao header e alimentada por eventos realtime.
- **Import/Export**: utilitários e hooks CSV reutilizáveis (`src/core/import-export/*`) aplicados na tabela de campanhas Ads.
- **Chat IA (Gemini)**: card de conversa no módulo Ads (`GeminiChatCard`) com suporte a n8n (`/ads/chat`) e fallback para API oficial Gemini.
- **Chat IA Global**: drawer "Atlas AI Global" disponível no header (ícone de robô), com conversa + catálogo de capacidades multimodais e suporte a endpoint n8n dedicado (`VITE_N8N_AI_CHAT_URL`).
