export interface ChainHandler<TInput, TResult> {
  setNext(
    handler: ChainHandler<TInput, TResult>,
  ): ChainHandler<TInput, TResult>;
  handle(input: TInput): Promise<TResult | null>;
}

export abstract class AbstractChainHandler<
  TInput,
  TResult,
> implements ChainHandler<TInput, TResult> {
  private nextHandler: ChainHandler<TInput, TResult> | null = null;

  setNext(
    handler: ChainHandler<TInput, TResult>,
  ): ChainHandler<TInput, TResult> {
    this.nextHandler = handler;
    return handler;
  }

  async handle(input: TInput): Promise<TResult | null> {
    const result = await this.process(input);
    if (result !== null) {
      return result;
    }

    if (!this.nextHandler) {
      return null;
    }

    return this.nextHandler.handle(input);
  }

  protected abstract process(input: TInput): Promise<TResult | null>;
}
