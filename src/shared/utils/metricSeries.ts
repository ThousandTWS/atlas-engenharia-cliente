import dayjs from 'dayjs';

export interface MetricSeriesPoint {
  label: string;
  value: number;
}

export type MetricSeriesRecord = Record<string, unknown>;

const buildMonthBuckets = (months: number) =>
  Array.from({ length: months }, (_, index) => dayjs().subtract(months - 1 - index, 'month').startOf('month'));

export const buildEmptySeries = (months = 6): MetricSeriesPoint[] =>
  buildMonthBuckets(months).map((month) => ({ label: month.format('MM/YY'), value: 0 }));

export const parseNumericValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.-]/g, '');
    const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const pickNumericValue = (record: MetricSeriesRecord, keys: string[]): number => {
  for (const key of keys) {
    if (key in record) {
      return parseNumericValue(record[key]);
    }
  }

  return 0;
};

export const pickDateValue = (record: MetricSeriesRecord, keys: string[]): dayjs.Dayjs | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = dayjs(value);
      if (parsed.isValid()) {
        return parsed;
      }
    }
  }

  return null;
};

export const buildMonthlySeries = (
  records: MetricSeriesRecord[],
  dateKeys: string[],
  valueGetter: (record: MetricSeriesRecord) => number,
  months = 6,
): MetricSeriesPoint[] => {
  if (!records.length) {
    return buildEmptySeries(months);
  }

  const monthBuckets = buildMonthBuckets(months);
  const aggregate = new Map(monthBuckets.map((month) => [month.format('YYYY-MM'), 0]));

  records.forEach((record) => {
    const date = pickDateValue(record, dateKeys);
    if (!date) {
      return;
    }

    const monthKey = date.startOf('month').format('YYYY-MM');
    if (!aggregate.has(monthKey)) {
      return;
    }

    aggregate.set(monthKey, (aggregate.get(monthKey) ?? 0) + valueGetter(record));
  });

  return monthBuckets.map((month) => ({
    label: month.format('MM/YY'),
    value: Number((aggregate.get(month.format('YYYY-MM')) ?? 0).toFixed(2)),
  }));
};

export const toSeriesRecords = <T>(items: T[]): MetricSeriesRecord[] =>
  items.filter((item): item is T & MetricSeriesRecord => typeof item === 'object' && item !== null);
