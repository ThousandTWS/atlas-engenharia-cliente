type FormatterConfig = {
  locale: string;
  options: Intl.NumberFormatOptions;
};

class NumberFormatterFlyweightFactory {
  private readonly cache = new Map<string, Intl.NumberFormat>();

  get(config: FormatterConfig): Intl.NumberFormat {
    const key = `${config.locale}:${JSON.stringify(config.options)}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const formatter = new Intl.NumberFormat(config.locale, config.options);
    this.cache.set(key, formatter);
    return formatter;
  }
}

const factory = new NumberFormatterFlyweightFactory();

const getPtBrNumberFormatter = (maximumFractionDigits = 0) =>
  factory.get({
    locale: 'pt-BR',
    options: { maximumFractionDigits },
  });

const getPtBrCurrencyFormatter = (maximumFractionDigits = 0) =>
  factory.get({
    locale: 'pt-BR',
    options: {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits,
    },
  });

export const formatNumberPtBr = (value: number, maximumFractionDigits = 0): string =>
  getPtBrNumberFormatter(maximumFractionDigits).format(value);

export const formatCurrencyPtBr = (value: number, maximumFractionDigits = 0): string =>
  getPtBrCurrencyFormatter(maximumFractionDigits).format(value);

export const formatPercentPtBr = (value: number, maximumFractionDigits = 2): string =>
  `${formatNumberPtBr(value, maximumFractionDigits)}%`;
