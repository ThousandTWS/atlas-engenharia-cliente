import type { InputNumberProps } from 'antd';

type CurrencyValue = string | number;

const EMPTY_VALUE: CurrencyValue = '';
const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const normalizeCurrencyToNumber = (rawValue: string): number | null => {
  const sanitizedValue = rawValue
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/[^\d,.-]/g, '');

  if (
    sanitizedValue === ''
    || sanitizedValue === '-'
    || sanitizedValue === ','
    || sanitizedValue === '.'
    || sanitizedValue === '-,'
    || sanitizedValue === '-.'
  ) {
    return null;
  }

  const hasComma = sanitizedValue.includes(',');
  const isDotThousandsPattern = /^\d{1,3}(\.\d{3})+$/.test(sanitizedValue);

  const normalizedValue = hasComma
    ? sanitizedValue.replace(/\./g, '').replace(',', '.')
    : isDotThousandsPattern
      ? sanitizedValue.replace(/\./g, '')
      : sanitizedValue;

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const formatCurrencyInput: NonNullable<InputNumberProps<CurrencyValue>['formatter']> = (value, info) => {
  if (info.userTyping) {
    return info.input;
  }

  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numericValue = normalizeCurrencyToNumber(String(value));
  if (numericValue === null) {
    return '';
  }

  return `R$ ${numericValue.toLocaleString('pt-BR', CURRENCY_FORMAT_OPTIONS)}`;
};

export const parseCurrencyInput: NonNullable<InputNumberProps<CurrencyValue>['parser']> = (value) => {
  if (!value) {
    return EMPTY_VALUE;
  }

  const numericValue = normalizeCurrencyToNumber(value);
  return numericValue ?? EMPTY_VALUE;
};
