interface GeminiErrorPayload {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface GeminiCandidatePayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface GeminiModelsListPayload {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
}

interface GenerateGeminiContentParams {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  body: unknown;
  fallbackModels?: string[];
}

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];

const normalizeModelName = (model: string) => model.trim().replace(/^models\//i, '');

const parseResponseError = async (response: Response): Promise<string> => {
  const rawText = await response.text();

  if (!rawText) {
    return `HTTP ${response.status}`;
  }

  try {
    const parsed = JSON.parse(rawText) as GeminiErrorPayload;
    const message = parsed.error?.message?.trim();
    if (message) {
      return message;
    }
  } catch {
    // noop: fallback below
  }

  return rawText;
};

const extractGeneratedText = (payload: unknown): string | null => {
  const typedPayload = payload as GeminiCandidatePayload;
  return typedPayload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
};

const requestGenerateContent = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  body: unknown,
) => {
  const response = await fetch(
    `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorMessage = await parseResponseError(response);
    throw new Error(`Gemini API falhou (${response.status}) [${model}]: ${errorMessage}`);
  }

  const payload = await response.json();
  const text = extractGeneratedText(payload);
  if (!text) {
    throw new Error(`Gemini não retornou conteúdo para o model ${model}.`);
  }

  return text;
};

const listGenerateContentModels = async (baseUrl: string, apiKey: string): Promise<string[]> => {
  const response = await fetch(`${baseUrl}/models?key=${apiKey}`);
  if (!response.ok) {
    return [];
  }

  const payload = await response.json() as GeminiModelsListPayload;
  const models = payload.models ?? [];

  return models
    .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => model.name ?? '')
    .filter((name) => name.length > 0)
    .map(normalizeModelName);
};

const prioritizeModels = (models: string[]): string[] => {
  const priority = DEFAULT_FALLBACK_MODELS;
  const ranked = [...models].sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    const pa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const pb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
    return pa - pb;
  });

  return Array.from(new Set(ranked));
};

export async function generateGeminiContent(params: GenerateGeminiContentParams): Promise<string> {
  const apiKey = params.apiKey.trim();
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY não configurada.');
  }

  const baseUrl = params.baseUrl?.trim() || DEFAULT_GEMINI_BASE_URL;
  const primaryModel = normalizeModelName(params.model?.trim() || DEFAULT_GEMINI_MODEL);

  try {
    return await requestGenerateContent(baseUrl, apiKey, primaryModel, params.body);
  } catch (primaryError) {
    const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
    const isModelResolutionError = primaryMessage.includes('(404)')
      || /not found|not supported for generatecontent/i.test(primaryMessage);
    if (!isModelResolutionError) {
      throw primaryError;
    }
  }

  const discoveredModels = await listGenerateContentModels(baseUrl, apiKey);
  const fallbackCandidates = prioritizeModels([
    ...discoveredModels,
    ...(params.fallbackModels ?? []),
  ]).filter((model) => model !== primaryModel);

  let lastError: unknown = null;
  for (const candidate of fallbackCandidates) {
    try {
      return await requestGenerateContent(baseUrl, apiKey, candidate, params.body);
    } catch (error) {
      lastError = error;
    }
  }

  const finalMessage = lastError instanceof Error ? lastError.message : 'Sem detalhes adicionais.';
  throw new Error(
    `Nenhum model Gemini compatível respondeu. Model inicial: ${primaryModel}. Tentativas: ${[primaryModel, ...fallbackCandidates].join(', ')}. Último erro: ${finalMessage}`,
  );
}
