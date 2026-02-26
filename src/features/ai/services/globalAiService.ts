import axios from 'axios';
import { requestAdsEndpoint } from '../../gestao-ads/services/adsIntegrationClient';
import { generateGeminiContent } from '../../../shared/utils/geminiGenerateContent';

export interface GlobalAiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SendGlobalAiMessageParams {
  prompt: string;
  history: GlobalAiMessage[];
  context?: Record<string, unknown>;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? 'AIzaSyDkl7qUpxBJUvt8D6KCD-iv1FXEZ_p9k54';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
const GEMINI_BASE_URL = import.meta.env.VITE_GEMINI_API_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
const N8N_AI_CHAT_URL = import.meta.env.VITE_N8N_AI_CHAT_URL?.trim() ?? '';

const normalizeN8nResponse = (response: unknown): string | null => {
  if (typeof response === 'string' && response.trim().length > 0) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return null;
  }

  const payload = response as Record<string, unknown>;
  const answer = payload.answer ?? payload.message ?? payload.text ?? payload.output;
  if (typeof answer === 'string' && answer.trim().length > 0) {
    return answer;
  }

  return null;
};

const tryN8nGlobalChat = async (params: SendGlobalAiMessageParams): Promise<string | null> => {
  if (!N8N_AI_CHAT_URL) {
    return null;
  }

  try {
    const response = await axios.post(
      N8N_AI_CHAT_URL,
      {
        prompt: params.prompt,
        history: params.history,
        context: params.context ?? {},
        module: 'global-ai',
      },
      { timeout: 30000 },
    );

    return normalizeN8nResponse(response.data);
  } catch (error) {
    console.warn('Global AI: endpoint n8n global indisponível.', error);
    return null;
  }
};

const tryAdsChatEndpoint = async (params: SendGlobalAiMessageParams): Promise<string | null> => {
  try {
    const response = await requestAdsEndpoint<unknown>('chat', {
      method: 'POST',
      data: {
        prompt: params.prompt,
        history: params.history,
        context: params.context ?? {},
        module: 'global-ai',
      },
    });

    return normalizeN8nResponse(response);
  } catch (error) {
    console.warn('Global AI: endpoint /ads/chat indisponível.', error);
    return null;
  }
};

const buildGeminiPayload = (params: SendGlobalAiMessageParams) => {
  const history = params.history.slice(-14).map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  return {
    systemInstruction: {
      parts: [{
        text: [
          'Você é o Atlas AI, assistente corporativo multimodal para operações de engenharia e gestão.',
          'Responda em português brasileiro, de forma objetiva e executável.',
          'Quando faltarem dados para executar ações, peça informações específicas.',
          'Você também sugere fluxos para imagem, vídeo, áudio, Google Search e Google Maps.',
        ].join(' '),
      }],
    },
    contents: [
      {
        role: 'user',
        parts: [{
          text: `Contexto atual da aplicação: ${JSON.stringify(params.context ?? {})}`,
        }],
      },
      ...history,
      {
        role: 'user',
        parts: [{ text: params.prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 900,
    },
  };
};

const requestDirectGemini = async (params: SendGlobalAiMessageParams): Promise<string> => {
  return generateGeminiContent({
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL,
    baseUrl: GEMINI_BASE_URL,
    body: buildGeminiPayload(params),
    fallbackModels: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'],
  });
};

export const sendGlobalAiMessage = async (params: SendGlobalAiMessageParams): Promise<string> => {
  const n8nGlobalAnswer = await tryN8nGlobalChat(params);
  if (n8nGlobalAnswer) {
    return n8nGlobalAnswer;
  }

  const adsEndpointAnswer = await tryAdsChatEndpoint(params);
  if (adsEndpointAnswer) {
    return adsEndpointAnswer;
  }

  return requestDirectGemini(params);
};
