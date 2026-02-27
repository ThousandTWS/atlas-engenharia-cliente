import { FirstMatchStrategyResolver, type StrategyMatcher } from '../../../core/patterns/strategy';

type BadgeClass =
  | 'atlas-status-badge-success'
  | 'atlas-status-badge-info'
  | 'atlas-status-badge-warning'
  | 'atlas-status-badge-danger'
  | 'atlas-status-badge-neutral';

type ProjectPhase = 'analysis' | 'approved' | 'rejected' | 'other';

const normalizeStatusKey = (status: unknown): string =>
  String(status ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

const byExact = <TResult>(
  terms: readonly string[],
  output: TResult,
): StrategyMatcher<string, TResult> => ({
  matches: (input) => terms.includes(input),
  resolve: () => output,
});

const badgeClassResolver = new FirstMatchStrategyResolver<string, BadgeClass>(
  [
    byExact(['APROVADO', 'CONCLUIDO', 'PAGO', 'RECEBIDO', 'ATIVA', 'ATIVO'], 'atlas-status-badge-success'),
    byExact(['EM_ANDAMENTO', 'PROCESSANDO', 'EM_EXECUCAO'], 'atlas-status-badge-info'),
    byExact(['PENDENTE', 'EM_ANALISE', 'EM_ANALISE_TECNICA', 'AGUARDANDO'], 'atlas-status-badge-warning'),
    byExact(['REPROVADO', 'CANCELADO', 'FALHA', 'NEGADO'], 'atlas-status-badge-danger'),
  ],
  () => 'atlas-status-badge-neutral',
);

const projectPhaseResolver = new FirstMatchStrategyResolver<string, ProjectPhase>(
  [
    byExact(['EM_ANDAMENTO', 'EM_ANALISE', 'EM_ANALISE_TECNICA'], 'analysis'),
    byExact(['CONCLUIDO', 'APROVADO'], 'approved'),
    byExact(['CANCELADO', 'REPROVADO'], 'rejected'),
  ],
  () => 'other',
);

export const resolveStatusBadgeClass = (status: unknown): BadgeClass =>
  badgeClassResolver.execute(normalizeStatusKey(status));

export const resolveProjectPhase = (status: unknown): ProjectPhase =>
  projectPhaseResolver.execute(normalizeStatusKey(status));

export const isApprovedPhase = (status: unknown): boolean =>
  resolveProjectPhase(status) === 'approved';
