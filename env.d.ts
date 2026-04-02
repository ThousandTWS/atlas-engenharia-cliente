/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_MODE?: 'cookie' | 'bearer';
  readonly VITE_ADS_DATA_SOURCE?: 'backend' | 'n8n';
  readonly VITE_N8N_ADS_BASE_URL?: string;
  readonly VITE_N8N_ADS_ENDPOINT_PERFORMANCE?: string;
  readonly VITE_N8N_ADS_ENDPOINT_CAMPAIGNS?: string;
  readonly VITE_N8N_ADS_ENDPOINT_INSIGHTS?: string;
  readonly VITE_N8N_ADS_PERFORMANCE_URL?: string;
  readonly VITE_N8N_ADS_CAMPAIGNS_URL?: string;
  readonly VITE_N8N_ADS_INSIGHTS_URL?: string;
  readonly VITE_N8N_ADS_AUTH_TYPE?: 'none' | 'bearer' | 'api_key';
  readonly VITE_N8N_ADS_BEARER_TOKEN?: string;
  readonly VITE_N8N_ADS_API_KEY?: string;
  readonly VITE_N8N_ADS_API_KEY_HEADER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
