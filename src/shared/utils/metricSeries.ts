import dayjs, { type Dayjs } from 'dayjs';

export interface MetricSeriesPoint {
  label: string;
  value: number;
}

export type MetricSeriesRecord = Record<string, unknown>;
export type MetricPeriodOption = '1m' | '3m' | '6m' | '12m' | 'custom';
export type MetricGroupingOption = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface MetricSeriesFilters {
  period: MetricPeriodOption;
  grouping: MetricGroupingOption;
  customRange?: [Dayjs | null, Dayjs | null] | null;
}

export const createDefaultCustomRange = (): [Dayjs, Dayjs] => ([
  dayjs().subtract(29, 'day').startOf('day'),
  dayjs().endOf('day'),
]);

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

const getQuarter = (date: Dayjs) => Math.floor(date.month() / 3) + 1;

const getRangeFromFilters = (filters: MetricSeriesFilters) => {
  const now = dayjs();

  if (filters.period === 'custom') {
    const [rawStart, rawEnd] = filters.customRange ?? [];
    const end = (rawEnd ?? now).endOf('day');
    const start = (rawStart ?? end.subtract(29, 'day')).startOf('day');

    return start.isAfter(end) ? { start: end.startOf('day'), end } : { start, end };
  }

  const monthCountMap: Record<Exclude<MetricPeriodOption, 'custom'>, number> = {
    '1m': 1,
    '3m': 3,
    '6m': 6,
    '12m': 12,
  };

  const months = monthCountMap[filters.period];
  return {
    start: now.startOf('month').subtract(months - 1, 'month'),
    end: now.endOf('day'),
  };
};

const alignBucketStart = (date: Dayjs, grouping: MetricGroupingOption) => {
  switch (grouping) {
    case 'weekly':
      return date.startOf('week');
    case 'monthly':
      return date.startOf('month');
    case 'quarterly':
      return date.month(Math.floor(date.month() / 3) * 3).startOf('month');
    case 'yearly':
      return date.startOf('year');
    default:
      return date.startOf('day');
  }
};

const addBucketStep = (date: Dayjs, grouping: MetricGroupingOption) => {
  switch (grouping) {
    case 'weekly':
      return date.add(1, 'week');
    case 'monthly':
      return date.add(1, 'month');
    case 'quarterly':
      return date.add(3, 'month');
    case 'yearly':
      return date.add(1, 'year');
    default:
      return date;
  }
};

const getBucketKey = (date: Dayjs, grouping: MetricGroupingOption) => {
  switch (grouping) {
    case 'weekly':
      return date.startOf('week').format('YYYY-MM-DD');
    case 'monthly':
      return date.startOf('month').format('YYYY-MM');
    case 'quarterly':
      return `${date.year()}-Q${getQuarter(date)}`;
    case 'yearly':
      return date.startOf('year').format('YYYY');
    default:
      return date.format();
  }
};

const formatBucketLabel = (date: Dayjs, grouping: MetricGroupingOption) => {
  switch (grouping) {
    case 'weekly':
      return date.format('DD/MM');
    case 'monthly':
      return date.format('MM/YY');
    case 'quarterly':
      return `T${getQuarter(date)}/${date.format('YY')}`;
    case 'yearly':
      return date.format('YYYY');
    default:
      return date.format('DD/MM/YY');
  }
};

export const buildFilteredSeries = (
  records: MetricSeriesRecord[],
  dateKeys: string[],
  valueGetter: (record: MetricSeriesRecord) => number,
  filters: MetricSeriesFilters,
): MetricSeriesPoint[] => {
  const { start, end } = getRangeFromFilters(filters);
  const bucketStart = alignBucketStart(start, filters.grouping);
  const aggregate = new Map<string, number>();
  const buckets: { key: string; label: string }[] = [];

  for (let cursor = bucketStart; cursor.isBefore(end) || cursor.isSame(end); cursor = addBucketStep(cursor, filters.grouping)) {
    const key = getBucketKey(cursor, filters.grouping);
    buckets.push({ key, label: formatBucketLabel(cursor, filters.grouping) });
    aggregate.set(key, 0);
  }

  records.forEach((record) => {
    const date = pickDateValue(record, dateKeys);
    if (!date || date.isBefore(start) || date.isAfter(end)) {
      return;
    }

    const key = getBucketKey(date, filters.grouping);
    if (!aggregate.has(key)) {
      return;
    }

    aggregate.set(key, (aggregate.get(key) ?? 0) + valueGetter(record));
  });

  return buckets.map(({ key, label }) => ({
    label,
    value: Number((aggregate.get(key) ?? 0).toFixed(2)),
  }));
};
