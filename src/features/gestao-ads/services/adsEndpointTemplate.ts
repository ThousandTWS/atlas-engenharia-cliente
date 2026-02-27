import {
  extractArrayPayload,
  requestAdsEndpoint,
  type AdsEndpointKind,
  type AdsRequestConfig,
} from './adsIntegrationClient';

export abstract class AdsEndpointTemplate<TInput, TOutput> {
  protected abstract readonly endpointKind: AdsEndpointKind;

  protected abstract readonly arrayKeys: string[];

  protected abstract buildRequestConfig(input: TInput): AdsRequestConfig;

  protected abstract normalize(list: unknown[], input: TInput): TOutput;

  protected handleError(error: unknown): void {
    console.error(`Dashboard ADS: falha no endpoint ${this.endpointKind}`, error);
  }

  async execute(input: TInput): Promise<TOutput> {
    try {
      const response = await requestAdsEndpoint<unknown>(
        this.endpointKind,
        this.buildRequestConfig(input),
      );

      const list = extractArrayPayload(response, this.arrayKeys);
      return this.normalize(list, input);
    } catch (error) {
      this.handleError(error);
    }

    return this.normalize([], input);
  }
}
