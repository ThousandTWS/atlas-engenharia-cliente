/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import { requestAdsEndpoint } from '../../gestao-ads/services/adsIntegrationClient';
import { generateGeminiContent } from '../../../shared/utils/geminiGenerateContent';
import { AbstractChainHandler, type ChainHandler } from '../../../core/patterns/chain';

export interface GlobalAiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SendGlobalAiMessageParams {
  prompt: string;
  history: GlobalAiMessage[];
  context?: Record<string, unknown>;
}

interface GlobalAiStrategy {
  canHandle(params: SendGlobalAiMessageParams): boolean;
  execute(params: SendGlobalAiMessageParams): Promise<string | null>;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? 'AIzaSyCQOP9PfQ2O3If4l0zKswZyZvGDai_L7LU';
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

class StrategyChainHandler extends AbstractChainHandler<SendGlobalAiMessageParams, string> {
  private readonly strategy: GlobalAiStrategy;

  constructor(strategy: GlobalAiStrategy) {
    super();
    this.strategy = strategy;
  }

  protected async process(params: SendGlobalAiMessageParams): Promise<string | null> {
    if (this.strategy.canHandle(params)) {
      const answer = await this.strategy.execute(params);
      if (answer) {
        return answer;
      }
    }

    return null;
  }
}

class N8nGlobalChatStrategy implements GlobalAiStrategy {
  canHandle(_params: SendGlobalAiMessageParams): boolean {
    return Boolean(N8N_AI_CHAT_URL);
  }

  async execute(params: SendGlobalAiMessageParams): Promise<string | null> {
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
  }
}

class AdsChatStrategy implements GlobalAiStrategy {
  canHandle(_params: SendGlobalAiMessageParams): boolean {
    return true;
  }

  async execute(params: SendGlobalAiMessageParams): Promise<string | null> {
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
  }
}

class DirectGeminiStrategy implements GlobalAiStrategy {
  canHandle(_params: SendGlobalAiMessageParams): boolean {
    return true;
  }

  execute(params: SendGlobalAiMessageParams): Promise<string> {
    return requestDirectGemini(params);
  }
}

const createGlobalAiHandlerChain = (): ChainHandler<SendGlobalAiMessageParams, string> => {
  const n8nHandler = new StrategyChainHandler(new N8nGlobalChatStrategy());
  const adsHandler = new StrategyChainHandler(new AdsChatStrategy());
  const geminiHandler = new StrategyChainHandler(new DirectGeminiStrategy());

  n8nHandler.setNext(adsHandler).setNext(geminiHandler);
  return n8nHandler;
};

const globalAiHandlerChain = createGlobalAiHandlerChain();

export const sendGlobalAiMessage = async (params: SendGlobalAiMessageParams): Promise<string> => {
  const answer = await globalAiHandlerChain.handle(params);
  if (answer) {
    return answer;
  }

  throw new Error('Nenhum provedor de IA retornou resposta.');
};
