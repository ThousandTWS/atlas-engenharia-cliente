import { requestAdsEndpoint } from './adsIntegrationClient';
import type { CampaignPerformance, PerformancePoint } from './adsDataService';
import { generateGeminiContent } from '../../../shared/utils/geminiGenerateContent';

export interface GeminiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiChatContext {
  campaigns: CampaignPerformance[];
  performance: PerformancePoint[];
}

interface SendGeminiMessageParams {
  prompt: string;
  history: GeminiChatMessage[];
  context: GeminiChatContext;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
const GEMINI_BASE_URL = import.meta.env.VITE_GEMINI_API_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta';

const buildContextSummary = (context: GeminiChatContext) => {
  const campaigns = context.campaigns.slice(0, 25).map((item) => ({
    nome: item.nome,
    tipo: item.tipo,
    status: item.status,
    custo: item.custo,
    conversoes: item.conversoes,
  }));

  const performance = context.performance.slice(-30);

  return {
    campaigns,
    performance,
  };
};

const tryFromN8n = async (payload: SendGeminiMessageParams): Promise<string | null> => {
  try {
    const response = await requestAdsEndpoint<unknown>('chat', {
      method: 'POST',
      data: {
        prompt: payload.prompt,
        history: payload.history,
        context: buildContextSummary(payload.context),
      },
    });

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const asRecord = response as Record<string, unknown>;
      const candidate = asRecord.answer ?? asRecord.message ?? asRecord.text ?? asRecord.output;
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }
  } catch (error) {
    console.warn('Gemini Chat: fallback para API direta (n8n indisponível).', error);
  }

  return null;
};

const buildDirectGeminiPayload = (params: SendGeminiMessageParams) => {
  const history = params.history.slice(-10).map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  return {
    systemInstruction: {
      parts: [{
        text: 'Você é um analista sênior de tráfego pago da Atlas Engenharia. Responda em português, de forma objetiva e executável.',
      }],
    },
    contents: [
      {
        role: 'user',
        parts: [{
          text: `Contexto ADS (json): ${JSON.stringify(buildContextSummary(params.context))}`,
        }],
      },
      ...history,
      {
        role: 'user',
        parts: [{ text: params.prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.25,
      topP: 0.9,
      maxOutputTokens: 900,
    },
  };
};

const requestDirectGemini = async (params: SendGeminiMessageParams): Promise<string> => {
  return generateGeminiContent({
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL,
    baseUrl: GEMINI_BASE_URL,
    body: buildDirectGeminiPayload(params),
    fallbackModels: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'],
  });
};

export const sendGeminiMessage = async (params: SendGeminiMessageParams): Promise<string> => {
  const n8nResult = await tryFromN8n(params);
  if (n8nResult) {
    return n8nResult;
  }

  return requestDirectGemini(params);
};
