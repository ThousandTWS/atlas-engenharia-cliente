export interface StrategyMatcher<TInput, TResult> {
  matches(input: TInput): boolean;
  resolve(input: TInput): TResult;
}

export class FirstMatchStrategyResolver<TInput, TResult> {
  private readonly strategies: readonly StrategyMatcher<TInput, TResult>[];

  private readonly fallback: (input: TInput) => TResult;

  constructor(
    strategies: readonly StrategyMatcher<TInput, TResult>[],
    fallback: (input: TInput) => TResult,
  ) {
    this.strategies = strategies;
    this.fallback = fallback;
  }

  execute(input: TInput): TResult {
    for (const strategy of this.strategies) {
      if (strategy.matches(input)) {
        return strategy.resolve(input);
      }
    }

    return this.fallback(input);
  }
}
