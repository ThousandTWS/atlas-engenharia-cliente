import { FirstMatchStrategyResolver, type StrategyMatcher } from '../../../core/patterns/strategy';

type CampaignStatus = 'Ativa' | 'Limitada' | 'Pausada';
type CampaignType = 'Pesquisa' | 'Display' | 'Vídeo' | 'PMax';
type InsightImpact = 'ROI' | 'Orçamento' | 'Criativos' | 'Lances';
type InsightPriority = 'alta' | 'media' | 'baixa';

const normalizeText = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase();

const includesAny = (value: string, terms: readonly string[]): boolean =>
  terms.some((term) => value.includes(term));

const byIncludes = <TResult>(
  terms: readonly string[],
  output: TResult,
): StrategyMatcher<string, TResult> => ({
  matches: (input) => includesAny(input, terms),
  resolve: () => output,
});

const byExact = <TResult>(
  terms: readonly string[],
  output: TResult,
): StrategyMatcher<string, TResult> => ({
  matches: (input) => terms.includes(input),
  resolve: () => output,
});

const campaignStatusResolver = new FirstMatchStrategyResolver<string, CampaignStatus>(
  [
    byIncludes(['ativa', 'active', 'enabled'], 'Ativa'),
    byIncludes(['limitada', 'limited', 'limit'], 'Limitada'),
  ],
  () => 'Pausada',
);

const campaignTypeResolver = new FirstMatchStrategyResolver<string, CampaignType>(
  [
    byIncludes(['display'], 'Display'),
    byIncludes(['video', 'vídeo'], 'Vídeo'),
    byIncludes(['max', 'pmax', 'performance'], 'PMax'),
  ],
  () => 'Pesquisa',
);

const insightImpactResolver = new FirstMatchStrategyResolver<string, InsightImpact>(
  [
    byIncludes(['orc'], 'Orçamento'),
    byIncludes(['lance', 'bid'], 'Lances'),
    byIncludes(['criativo', 'creative'], 'Criativos'),
  ],
  () => 'ROI',
);

const insightPriorityResolver = new FirstMatchStrategyResolver<string, InsightPriority>(
  [
    byExact(['alta', 'high'], 'alta'),
    byExact(['baixa', 'low'], 'baixa'),
  ],
  () => 'media',
);

export const normalizeCampaignStatus = (value: unknown): CampaignStatus =>
  campaignStatusResolver.execute(normalizeText(value));

export const normalizeCampaignType = (value: unknown): CampaignType =>
  campaignTypeResolver.execute(normalizeText(value));

export const normalizeInsightImpact = (value: unknown): InsightImpact =>
  insightImpactResolver.execute(normalizeText(value));

export const normalizeInsightPriority = (value: unknown): InsightPriority =>
  insightPriorityResolver.execute(normalizeText(value));

export const getInsightImpactTagColor = (impact: InsightImpact): string => {
  const colorMap: Record<InsightImpact, string> = {
    ROI: 'green',
    Lances: 'blue',
    Orçamento: 'gold',
    Criativos: 'purple',
  };

  return colorMap[impact];
};

export const getInsightPriorityTagColor = (priority: InsightPriority): string => {
  const colorMap: Record<InsightPriority, string> = {
    alta: 'red',
    media: 'orange',
    baixa: 'default',
  };

  return colorMap[priority];
};
